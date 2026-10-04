import { createClient } from "jsr:@supabase/supabase-js@2.117.2";

import { loadScanConfig, runGmailScan } from "../_shared/gmail-scan.ts";
import { handleScheduledRequest } from "./handler.ts";

/** Fourni par le runtime Supabase Edge. */
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

/**
 * Analyse planifiée, appelée par le dispatcher SQL. Déployée avec
 * `verify_jwt = false` (supabase/config.toml) : l'authentification repose sur
 * le jeton à usage unique vérifié dans `handler.ts`.
 */

// Instance arrêtée avant la fin d'une analyse (limite de durée : 150 s en
// gratuit, 400 s en payant) : le nettoyeur clôt le run et compte l'échec.
addEventListener("beforeunload", (event) => {
  console.warn("arrêt de l'instance", (event as Event & { detail?: { reason?: string } }).detail?.reason);
});

Deno.serve((req) => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const config = loadScanConfig();

  return handleScheduledRequest(req, {
    admin,
    runScan: (request) => runGmailScan(admin, config, request),
    waitUntil: (promise) => EdgeRuntime.waitUntil(promise),
  });
});
