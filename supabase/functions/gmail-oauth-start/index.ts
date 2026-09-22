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
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI")!;
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
      { error: "Seuls les propriétaires et administrateurs peuvent connecter Gmail." },
      403,
    );
  }

  const payload = JSON.stringify({
    o: organizationId,
    u: userData.user.id,
    t: Date.now(),
    n: crypto.randomUUID(),
    r: returnTo,
  });
  const encoded = btoa(payload);
  const signature = await signState(encoded, stateSecret);
  const state = `${encoded}.${signature}`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/gmail.readonly");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  return json({ authUrl: authUrl.toString() }, 200);
});
