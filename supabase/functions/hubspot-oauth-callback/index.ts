import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Page de retour, invariable : le navigateur ne demande jamais autre chose.
 * Seule l'ORIGINE est reprise du `returnTo` signé ; le chemin reste figé ici,
 * ce qui retire d'un coup toute manipulation de chemin (`//autre-site`,
 * traversée, ancre).
 */
const RETURN_PATH = "/integrations-hub";

/** Index partiel qui garantit une seule connexion HubSpot active par organisation. */
const ONE_ACTIVE_INDEX = "integrations_one_active_hubspot_per_org";

/**
 * Origines autorisées comme destination de fin de parcours, la PREMIÈRE
 * faisant office d'origine canonique (celle du repli).
 *
 * La signature du `state` ne valide pas son contenu : `hubspot-oauth-start`
 * signe le `returnTo` reçu du navigateur sans le regarder. Un owner/admin
 * authentifié peut donc obtenir un `state` parfaitement signé portant une
 * origine arbitraire. D'où cette liste : on valide à la lecture, on ne se fie
 * pas au HMAC.
 */
function allowedOrigins(): string[] {
  return (Deno.env.get("APP_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    // `URL.origin` rend toujours l'hôte en minuscules : sans cette
    // normalisation, une entrée en casse mixte ne correspondrait JAMAIS et
    // basculerait silencieusement sur le repli.
    .map((o) => o.toLowerCase())
    .filter(Boolean);
}

/**
 * Origine de destination retenue.
 *
 * Comparaison par ÉGALITÉ STRICTE sur `URL.origin`, qui normalise schéma,
 * hôte et port. Surtout pas de `startsWith` (laisserait passer
 * `https://nassflow.app.evil.example`) ni de `endsWith` (laisserait passer
 * `https://evil-nassflow.app`).
 */
function resolveOrigin(returnTo: unknown, allowed: string[], canonical: string): string {
  if (typeof returnTo !== "string" || returnTo === "") return canonical;

  let candidate: URL;
  try {
    candidate = new URL(returnTo);
  } catch {
    console.warn("returnTo illisible, repli sur l'origine canonique");
    return canonical;
  }

  if (!allowed.includes(candidate.origin)) {
    // Loguer l'origine refusée, jamais le payload entier : un domaine oublié
    // dans le secret doit se diagnostiquer en une minute.
    console.warn("origine de retour refusée", candidate.origin);
    return canonical;
  }
  return candidate.origin;
}

function back(origin: string, params: Record<string, string>) {
  const url = new URL(RETURN_PATH, origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

async function verifyState(
  state: string,
  secret: string,
): Promise<{ o: string; u: string; t: number; r: string; p?: string } | null> {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigBytes = new Uint8Array(
    signature.match(/.{2}/g)?.map((b) => parseInt(b, 16)) ?? [],
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    new TextEncoder().encode(encoded),
  );
  if (!valid) return null;

  try {
    const payload = JSON.parse(atob(encoded));
    if (Date.now() - payload.t > 10 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const reqUrl = new URL(req.url);
  const code = reqUrl.searchParams.get("code");
  const state = reqUrl.searchParams.get("state");
  const hubspotError = reqUrl.searchParams.get("error");

  console.log("callback reçu", {
    hasCode: Boolean(code),
    hasState: Boolean(state),
    hubspotError,
  });

  // Sans liste blanche, toute destination serait devinée : mieux vaut échouer
  // bruyamment que reconduire en silence une redirection en dur.
  const allowed = allowedOrigins();
  const canonical = allowed[0];
  if (!canonical) {
    console.error("APP_ALLOWED_ORIGINS absent ou vide : redirection impossible.");
    return new Response(
      "Configuration du serveur incomplète : la page de retour n'est pas définie.",
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  if (hubspotError) {
    console.log("HubSpot a renvoyé une erreur", hubspotError);
    return back(canonical, { hubspot: "refused" });
  }
  if (!code || !state) return back(canonical, { hubspot: "invalid" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const clientId = Deno.env.get("HUBSPOT_CLIENT_ID")!;
  const clientSecret = Deno.env.get("HUBSPOT_CLIENT_SECRET")!;
  const redirectUri = Deno.env.get("HUBSPOT_REDIRECT_URI")!;
  const stateSecret = Deno.env.get("OAUTH_STATE_SECRET")!;

  // Diagnostic : longueurs seulement, jamais les valeurs.
  console.log("secrets", {
    clientIdLen: clientId?.length ?? 0,
    clientSecretLen: clientSecret?.length ?? 0,
    redirectUri,
  });

  const payload = await verifyState(state, stateSecret);
  if (!payload) {
    console.log("state invalide ou expiré");
    return back(canonical, { hubspot: "expired" });
  }
  // Même secret que le parcours Gmail : sans ce contrôle, un state émis par
  // `gmail-oauth-start` serait accepté ici.
  if (payload.p !== "hubspot") {
    console.warn("state émis pour un autre fournisseur", payload.p);
    return back(canonical, { hubspot: "invalid" });
  }
  console.log("state validé", { org: payload.o });

  // `payload.r` n'est lisible qu'ici : un `state` non vérifié ne doit jamais
  // décider d'une destination.
  const appOrigin = resolveOrigin(payload.r, allowed, canonical);

  const tokenRes = await fetch("https://api.hubapi.com/oauth/2026-03/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    // C'est ICI que se trouve la cause. HubSpot renvoie `error` et
    // `error_description`.
    const detail = await tokenRes.text();
    console.error("échange de jetons refusé", tokenRes.status, detail);
    return back(appOrigin, { hubspot: "token_error" });
  }

  const tokens = await tokenRes.json();
  if (!tokens.refresh_token) {
    console.error("aucun refresh_token", Object.keys(tokens));
    return back(appOrigin, { hubspot: "no_refresh" });
  }

  // Le portail est donné par la réponse d'échange : pas besoin de l'endpoint
  // v1 `access-tokens/{token}`, déprécié.
  const hubId = String(tokens.hub_id ?? "");
  if (!hubId) {
    console.error("hub_id absent de la réponse d'échange", Object.keys(tokens));
    return back(appOrigin, { hubspot: "token_error" });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Un autre portail est-il déjà actif ? Vérifié AVANT d'écrire dans Vault :
  // dans le cas courant, un refus ne laisse ainsi aucun jeton orphelin. Le
  // même portail déjà actif n'est pas un conflit, c'est une réautorisation.
  const { data: otherActive, error: activeError } = await admin
    .from("integrations")
    .select("id")
    .eq("organization_id", payload.o)
    .eq("provider", "hubspot")
    .eq("status", "active")
    .neq("external_account_id", hubId)
    .maybeSingle();

  if (activeError) {
    console.error("lecture des connexions refusée", activeError.message);
    return back(appOrigin, { hubspot: "save_error" });
  }
  if (otherActive) {
    console.log("un autre portail HubSpot est déjà actif", { org: payload.o });
    return back(appOrigin, { hubspot: "already_connected" });
  }

  const secretName = `hubspot_${payload.o}_${hubId}`;
  const { data: secretId, error: vaultError } = await admin.rpc("vault_store_secret", {
    secret_value: tokens.refresh_token,
    secret_name: secretName,
  });

  if (vaultError) {
    console.error("écriture Vault refusée", vaultError.message);
    return back(appOrigin, { hubspot: "vault_error" });
  }

  const { error: insertError } = await admin.from("integrations").upsert(
    {
      organization_id: payload.o,
      provider: "hubspot",
      external_account_id: hubId,
      account_email: null,
      vault_secret_id: secretId,
      status: "active",
      connected_by: payload.u,
    },
    { onConflict: "organization_id,provider,external_account_id" },
  );

  if (insertError) {
    if (insertError.code === "23505" && insertError.message.includes(ONE_ACTIVE_INDEX)) {
      // Deux parcours se sont croisés après le contrôle ci-dessus : l'index a
      // tranché. Le jeton qu'on vient d'écrire ne sert à aucune ligne.
      console.log("connexion concurrente écartée par l'index", { org: payload.o });
      const { error: cleanupError } = await admin.rpc("vault_delete_secret", {
        secret_id: secretId,
      });
      if (cleanupError) console.error("nettoyage Vault refusé", cleanupError.message);
      return back(appOrigin, { hubspot: "already_connected" });
    }
    console.error("insertion integrations refusée", insertError.message);
    return back(appOrigin, { hubspot: "save_error" });
  }

  console.log("connexion réussie", { org: payload.o, hubId });
  return back(appOrigin, { hubspot: "connected", portal: hubId });
});
