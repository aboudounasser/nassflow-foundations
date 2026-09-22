import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Page de retour, invariable : le navigateur ne demande jamais autre chose
 * (`src/services/integrations-oauth.ts`). Seule l'ORIGINE est reprise du
 * `returnTo` signé ; le chemin reste figé ici, ce qui retire d'un coup toute
 * manipulation de chemin (`//autre-site`, traversée, ancre).
 */
const RETURN_PATH = "/integrations-hub";

/**
 * Origines autorisées comme destination de fin de parcours, la PREMIÈRE
 * faisant office d'origine canonique (celle du repli).
 *
 * La signature du `state` ne valide pas son contenu : `gmail-oauth-start`
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
): Promise<{ o: string; u: string; t: number; r: string } | null> {
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
  const googleError = reqUrl.searchParams.get("error");

  console.log("callback reçu", {
    hasCode: Boolean(code),
    hasState: Boolean(state),
    googleError,
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

  if (googleError) {
    console.log("Google a renvoyé une erreur", googleError);
    return back(canonical, { gmail: "refused" });
  }
  if (!code || !state) return back(canonical, { gmail: "invalid" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
  const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI")!;
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
    return back(canonical, { gmail: "expired" });
  }
  console.log("state validé", { org: payload.o });

  // `payload.r` n'est lisible qu'ici : un `state` non vérifié ne doit jamais
  // décider d'une destination.
  const appOrigin = resolveOrigin(payload.r, allowed, canonical);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    // C'est ICI que se trouve la cause. Google renvoie un JSON explicite.
    const detail = await tokenRes.text();
    console.error("échange de jetons refusé", tokenRes.status, detail);
    return back(appOrigin, { gmail: "token_error" });
  }

  const tokens = await tokenRes.json();
  if (!tokens.refresh_token) {
    console.error("aucun refresh_token", Object.keys(tokens));
    return back(appOrigin, { gmail: "no_refresh" });
  }

  const profileRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } },
  );
  if (!profileRes.ok) {
    console.error("profil Gmail illisible", await profileRes.text());
    return back(appOrigin, { gmail: "profile_error" });
  }
  const profile = await profileRes.json();
  const accountEmail = String(profile.emailAddress ?? "").toLowerCase();

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const secretName = `gmail_${payload.o}_${accountEmail}`;
  const { data: secretId, error: vaultError } = await admin.rpc("vault_store_secret", {
    secret_value: tokens.refresh_token,
    secret_name: secretName,
  });

  if (vaultError) {
    console.error("écriture Vault refusée", vaultError.message);
    return back(appOrigin, { gmail: "vault_error" });
  }

  const { error: insertError } = await admin.from("integrations").upsert(
    {
      organization_id: payload.o,
      provider: "gmail",
      account_email: accountEmail,
      vault_secret_id: secretId,
      status: "active",
      connected_by: payload.u,
    },
    { onConflict: "organization_id,provider,account_email" },
  );

  if (insertError) {
    console.error("insertion integrations refusée", insertError.message);
    return back(appOrigin, { gmail: "save_error" });
  }

  console.log("connexion réussie", accountEmail);
  return back(appOrigin, { gmail: "connected", email: accountEmail });
});
