import { createClient } from "jsr:@supabase/supabase-js@2.117.2";

import { loadScanConfig } from "../_shared/gmail-scan.ts";
import { handleDraftRequest } from "./handler.ts";

/**
 * Proposition de réponse de l'Email Agent, appelée depuis l'application.
 * La logique vit dans `handler.ts`.
 */
Deno.serve((req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  return handleDraftRequest(req, {
    userClient: (authHeader) =>
      createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } }),
    admin: createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    config: loadScanConfig(),
  });
});
