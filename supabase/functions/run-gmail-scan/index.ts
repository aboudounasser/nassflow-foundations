import { createClient } from "jsr:@supabase/supabase-js@2.117.2";

import { loadScanConfig, runGmailScan } from "../_shared/gmail-scan.ts";

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

/**
 * Analyse lancée à la main depuis l'application. Ce point d'entrée ne porte que
 * l'identification de l'appelant et la vérification de son rôle ; l'analyse
 * elle-même vit dans `_shared/gmail-scan.ts`.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const config = loadScanConfig();

  // ─── 1. Identifier l'appelant par son jeton ────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Authentification requise." }, 401);

  const asUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await asUser.auth.getUser();
  if (userError || !userData.user) return json({ error: "Session invalide." }, 401);

  let organizationId = "";
  let integrationId = "";
  try {
    const body = await req.json();
    organizationId = String(body.organizationId ?? "");
    integrationId = String(body.integrationId ?? "");
  } catch {
    return json({ error: "Requête invalide." }, 400);
  }
  if (!organizationId || !integrationId) {
    return json({ error: "Paramètres manquants." }, 400);
  }

  // ─── 2. Le rôle est vérifié en base, pas cru sur parole ────
  const { data: roleData } = await asUser.rpc("current_user_role", {
    org_id: organizationId,
  });
  if (!["owner", "admin"].includes(String(roleData))) {
    return json({ error: "Vous n'avez pas le droit de lancer une analyse." }, 403);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ─── 3. Analyse ────────────────────────────────────────────
  const outcome = await runGmailScan(admin, config, {
    organizationId,
    integrationId,
    triggeredBy: userData.user.id,
  });

  switch (outcome.kind) {
    case "rejected":
      return json({ error: outcome.error }, outcome.status);
    case "failed":
      return json({ error: outcome.error, runId: outcome.runId }, 500);
    case "succeeded":
      return json(outcome.summary, 200);
  }
});
