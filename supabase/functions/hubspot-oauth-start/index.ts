import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function signState(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const clientId = Deno.env.get("HUBSPOT_CLIENT_ID")!;
  const redirectUri = Deno.env.get("HUBSPOT_REDIRECT_URI")!;
  const stateSecret = Deno.env.get("OAUTH_STATE_SECRET")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Authentification requise." }, 401);

  const asUser = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await asUser.auth.getUser();
  if (userError || !userData.user) return json({ error: "Session invalide." }, 401);

  let organizationId: string;
  let returnTo: string;
  try {
    const body = await req.json();
    organizationId = String(body.organizationId ?? "");
    returnTo = String(body.returnTo ?? "");
  } catch {
    return json({ error: "Requête invalide." }, 400);
  }
  if (!organizationId) return json({ error: "Organisation manquante." }, 400);

  const { data: roleData, error: roleError } = await asUser
    .rpc("current_user_role", { org_id: organizationId });

  if (roleError) return json({ error: roleError.message }, 500);
  if (!["owner", "admin"].includes(String(roleData))) {
    return json(
      { error: "Seuls les propriétaires et administrateurs peuvent connecter HubSpot." },
      403,
    );
  }

  // Une entreprise n'a qu'un CRM : l'index partiel
  // `integrations_one_active_hubspot_per_org` le garantit en base. Ce refus
  // anticipé évite seulement un aller-retour inutile chez HubSpot.
  const { data: active, error: activeError } = await asUser
    .from("integrations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("provider", "hubspot")
    .eq("status", "active")
    .maybeSingle();

  if (activeError) return json({ error: activeError.message }, 500);
  if (active) {
    return json(
      { error: "Un CRM HubSpot est déjà connecté à cette organisation. Déconnectez-le d'abord." },
      409,
    );
  }

  // `p` lie le state à ce fournisseur : les deux parcours OAuth partagent
  // OAUTH_STATE_SECRET, la signature seule ne dit pas qui l'a émis.
  const payload = JSON.stringify({
    o: organizationId,
    u: userData.user.id,
    t: Date.now(),
    n: crypto.randomUUID(),
    r: returnTo,
    p: "hubspot",
  });
  const encoded = btoa(payload);
  const signature = await signState(encoded, stateSecret);
  const state = `${encoded}.${signature}`;

  const authUrl = new URL("https://app.hubspot.com/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "oauth crm.objects.contacts.read crm.objects.contacts.write");
  authUrl.searchParams.set("state", state);

  return json({ authUrl: authUrl.toString() }, 200);
});
