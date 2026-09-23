import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./http.ts";

export type Rol = "admin" | "staff" | "staff_fatture" | "cliente";
export interface Chiamante {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

/** Client con service_role: bypassa la RLS. Solo dentro le Edge Function, mai restituire al client. */
export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Chi sta chiamando (dal JWT dell'header Authorization). null se non loggato. */
export async function chiamante(req: Request): Promise<Chiamante | null> {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return null;
  const { data: ruolo } = await adminClient()
    .from("user_roles")
    .select("id, email, nombre, rol")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!ruolo) return null;
  return ruolo as Chiamante;
}

export const esTeam = (rol: Rol) => rol === "admin" || rol === "staff" || rol === "staff_fatture";
export const esFinance = (rol: Rol) => rol === "admin" || rol === "staff_fatture";

/** true se l'header porta il CRON_SECRET (pg_cron). */
export function autorizzatoCron(req: Request): boolean {
  if (!CRON_SECRET) return false;
  const auth = req.headers.get("Authorization") ?? "";
  return auth === `Bearer ${CRON_SECRET}`;
}

/** Richiede un utente loggato (qualsiasi ruolo). */
export async function richiediUtente(req: Request): Promise<Chiamante> {
  const c = await chiamante(req);
  if (!c) throw new HttpError(401, "Non autorizzato");
  return c;
}

/** Richiede un utente del team. */
export async function richiediTeam(req: Request): Promise<Chiamante> {
  const c = await richiediUtente(req);
  if (!esTeam(c.rol)) throw new HttpError(403, "Non autorizzato");
  return c;
}

/** Richiede admin o staff_fatture. */
export async function richiediFinance(req: Request): Promise<Chiamante> {
  const c = await richiediUtente(req);
  if (!esFinance(c.rol)) throw new HttpError(403, "Non autorizzato");
  return c;
}

/** Richiede admin. */
export async function richiediAdmin(req: Request): Promise<Chiamante> {
  const c = await richiediUtente(req);
  if (c.rol !== "admin") throw new HttpError(403, "Non autorizzato");
  return c;
}

/** Job: accetta pg_cron (CRON_SECRET) oppure un utente del team (lancio manuale). */
export async function richiediCronOTeam(req: Request): Promise<Chiamante | "cron"> {
  if (autorizzatoCron(req)) return "cron";
  return richiediTeam(req);
}
