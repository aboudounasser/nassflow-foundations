import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

/** Permet à l'interface d'afficher un message clair plutôt que planter. */
export const isSupabaseConfigured = Boolean(url && key);

let instance: SupabaseClient<Database> | null = null;

function getClient(): SupabaseClient<Database> {
  if (!url || !key) {
    throw new Error(
      "Configuration Supabase absente : VITE_SUPABASE_URL et " +
        "VITE_SUPABASE_PUBLISHABLE_KEY doivent être définies.",
    );
  }
  instance ??= createClient<Database>(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return instance;
}

/**
 * Proxy paresseux : le client n'est instancié qu'au PREMIER USAGE, jamais
 * à l'import. Le rendu serveur peut donc charger ce module sans risque.
 */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
