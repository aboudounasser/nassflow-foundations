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

/** Découpe « Marie Dupont » en prénom / nom. HubSpot les sépare. */
function splitName(full: string | null): { first: string; last: string } {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const hubspotToken = Deno.env.get("HUBSPOT_ACCESS_TOKEN")!;

  // ─── 1. Identifier l'appelant par son jeton ────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Authentification requise." }, 401);

  const asUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await asUser.auth.getUser();
  if (userError || !userData.user) return json({ error: "Session invalide." }, 401);

  let organizationId = "";
  let resultId = "";
  try {
    const body = await req.json();
    organizationId = String(body.organizationId ?? "");
    resultId = String(body.resultId ?? "");
  } catch {
    return json({ error: "Requête invalide." }, 400);
  }
  if (!organizationId || !resultId) {
    return json({ error: "Paramètres manquants." }, 400);
  }

  // ─── 2. Le rôle est vérifié en base ────────────────────────
  const { data: roleData } = await asUser.rpc("current_user_role", {
    org_id: organizationId,
  });
  if (!["owner", "admin"].includes(String(roleData))) {
    return json({ error: "Vous n'avez pas le droit d'envoyer vers le CRM." }, 403);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ─── 3. Le résultat DOIT appartenir à cette organisation ───
  //    Sans ce filtre, connaître un resultId suffirait à envoyer le
  //    prospect d'un autre client dans ce CRM.
  const { data: result, error: resultError } = await admin
    .from("run_results")
    .select("id, organization_id, extracted, pushed_to_crm_at, source_subject")
    .eq("id", resultId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (resultError || !result) {
    return json({ error: "Prospect introuvable." }, 404);
  }
  if (result.pushed_to_crm_at) {
    return json({ error: "Ce prospect a déjà été envoyé dans le CRM." }, 409);
  }

  const extracted = (result.extracted ?? {}) as Record<string, string | null>;
  const email = (extracted.email ?? "").trim().toLowerCase();

  // HubSpot déduplique sur l'e-mail : sans lui, on créerait des
  // doublons à chaque envoi.
  if (!email) {
    return json(
      { error: "Aucune adresse e-mail extraite : impossible de créer le contact." },
      422,
    );
  }

  const { first, last } = splitName(extracted.name);

  try {
    // ─── 4. Le contact existe-t-il déjà ? ────────────────────
    const searchRes = await fetch(
      "https://api.hubapi.com/crm/v3/objects/contacts/search",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hubspotToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [{ propertyName: "email", operator: "EQ", value: email }],
            },
          ],
          properties: ["email", "firstname", "lastname", "company", "phone"],
          limit: 1,
        }),
      },
    );

    if (!searchRes.ok) {
      const detail = await searchRes.text();
      console.error("recherche HubSpot refusée", searchRes.status, detail);
      return json({ error: "Le CRM a refusé la recherche." }, 502);
    }

    const search = await searchRes.json();
    const existing = search.results?.[0] ?? null;

    let contactId: string;
    let action: "created" | "updated";

    if (existing) {
      // ─── 5a. Contact existant : ne compléter QUE les vides ──
      //     Le CRM du client fait autorité, pas notre extraction.
      const props = existing.properties ?? {};
      const patch: Record<string, string> = {};

      if (!props.firstname && first) patch.firstname = first;
      if (!props.lastname && last) patch.lastname = last;
      if (!props.company && extracted.company) patch.company = extracted.company;
      if (!props.phone && extracted.phone) patch.phone = extracted.phone;

      if (Object.keys(patch).length > 0) {
        const patchRes = await fetch(
          `https://api.hubapi.com/crm/v3/objects/contacts/${existing.id}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${hubspotToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ properties: patch }),
          },
        );
        if (!patchRes.ok) {
          console.error("mise à jour HubSpot refusée", await patchRes.text());
          return json({ error: "Le CRM a refusé la mise à jour." }, 502);
        }
      }

      contactId = String(existing.id);
      action = "updated";
    } else {
      // ─── 5b. Création ────────────────────────────────────────
      const properties: Record<string, string> = { email };
      if (first) properties.firstname = first;
      if (last) properties.lastname = last;
      if (extracted.company) properties.company = extracted.company;
      if (extracted.phone) properties.phone = extracted.phone;

      const createRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hubspotToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ properties }),
      });

      if (!createRes.ok) {
        const detail = await createRes.text();
        console.error("création HubSpot refusée", createRes.status, detail);
        return json({ error: "Le CRM a refusé la création du contact." }, 502);
      }

      contactId = String((await createRes.json()).id);
      action = "created";
    }

    // ─── 6. Tracer l'envoi ───────────────────────────────────
    //     Écrit APRÈS l'appel au CRM : si HubSpot échoue, le
    //     prospect reste envoyable.
    const { error: updateError } = await admin
      .from("run_results")
      .update({
        pushed_to_crm_at: new Date().toISOString(),
        crm_contact_id: contactId,
        crm_action: action,
      })
      .eq("id", resultId);

    if (updateError) {
      // Le contact existe dans HubSpot mais la trace a échoué.
      // Mieux vaut le signaler que laisser croire à un succès complet.
      console.error("trace non écrite", updateError.message);
      return json(
        {
          contactId,
          action,
          warning: "Contact créé, mais la trace n'a pas pu être enregistrée.",
        },
        200,
      );
    }

    return json({ contactId, action }, 200);
  } catch (e) {
    console.error("échec inattendu", e);
    return json(
      { error: e instanceof Error ? e.message : "Erreur inattendue." },
      500,
    );
  }
});
