import { createClient } from "@supabase/supabase-js";
import { type Database } from "./types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  throw new Error("Mancano VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY nel .env");
}

/** Unico punto di accesso a Supabase in tutto il progetto. */
export const supabase = createClient<Database>(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
