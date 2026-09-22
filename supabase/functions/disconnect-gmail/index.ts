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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

  // ─── 2. Le rôle est vérifié en base ────────────────────────
  const { data: roleData } = await asUser.rpc("current_user_role", {
    org_id: organizationId,
  });
  if (!["owner", "admin"].includes(String(roleData))) {
    return json({ error: "Vous n'avez pas le droit de déconnecter ce compte." }, 403);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ─── 3. L'intégration DOIT appartenir à cette organisation ─
  const { data: integration, error: intError } = await admin
    .from("integrations")
    .select("id, organization_id, vault_secret_id, status")
    .eq("id", integrationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (intError || !integration) {
    return json({ error: "Intégration introuvable." }, 404);
  }
  if (integration.status === "revoked") {
    // Idempotent : redemander une déconnexion déjà faite n'est pas
    // une erreur, juste un no-op.
    return json({ status: "revoked" }, 200);
  }

  // ─── 4. Nettoyer Vault AVANT de marquer révoqué ────────────
  //    Dans l'autre ordre, un échec de suppression laisserait le
  //    statut 'revoked' avec le jeton encore présent — silencieux
  //    et trompeur.
  const { error: vaultError } = await admin.rpc("vault_delete_secret", {
    secret_id: integration.vault_secret_id,
  });
  if (vaultError) {
    console.error("suppression Vault refusée", vaultError.message);
    return json({ error: "Impossible de révoquer l'accès. Réessayez." }, 500);
  }

  // ─── 5. Marquer révoqué ─────────────────────────────────────
  const { error: updateError } = await admin
    .from("integrations")
    .update({ status: "revoked" })
    .eq("id", integrationId);

  if (updateError) {
    // Le secret est déjà supprimé : impossible de revenir en arrière
    // proprement. On le signale plutôt que de masquer l'incohérence.
    console.error("mise à jour du statut refusée", updateError.message);
    return json(
      { error: "Le jeton a été révoqué mais le statut n'a pas pu être mis à jour." },
      500,
    );
  }

  return json({ status: "revoked" }, 200);
});
