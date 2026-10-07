/**
 * Le due operazioni che seguono la firma, dal gestionale:
 *   registraPagamento — incasso ricevuto: account del cliente (se non c'è), scheda con
 *                       da_attivare, fattura incassata, contratto → pagato. Al cliente non parte nulla.
 *   attivaProgramma   — Wesley ha aperto gli accessi a mano: contratto → attivo, scadenza a
 *                       durata_mesi, recesso 14 giorni (solo privati), password se l'account è nuovo.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "../_shared/http.ts";
import { logError } from "../_shared/log.ts";
import { contrattoPerId, nuovaPassword, type RigaContratto } from "../_shared/contratti-archivio.ts";
import { oggiInItalia } from "../_shared/contratti/documento.ts";
import { CONSEGNE_ATTIVAZIONE, type DatiCliente, type DatiSocieta } from "../_shared/contratti/tipi.ts";
import { nomePartecipante } from "../_shared/contratti/validazione.ts";

/** YYYY-MM-DD + n mesi (fine mese compresa: 31/08 + 6 → 28/02). */
export function piuMesi(iso: string, mesi: number): string {
  const [a, m, g] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + mesi, 1));
  const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(g, ultimo));
  return d.toISOString().slice(0, 10);
}

export function piuGiorni(iso: string, giorni: number): string {
  const [a, m, g] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, g + giorni)).toISOString().slice(0, 10);
}

async function contrattoDa(admin: SupabaseClient, id: string): Promise<RigaContratto> {
  const c = await contrattoPerId(admin, id);
  if (!c) throw new HttpError(404, "Contratto non trovato.");
  return c;
}

/** L'account del cliente: si riusa se l'email ha già una scheda cliente, altrimenti nasce ora (password provvisoria). */
async function accountPer(admin: SupabaseClient, email: string, nome: string, contrattoId: string): Promise<string> {
  const { data: esistente } = await admin.from("user_roles").select("id, rol").ilike("email", email).maybeSingle();
  if (esistente) {
    const u = esistente as { id: string; rol: string };
    if (u.rol !== "cliente") throw new HttpError(409, "Questa email appartiene a un membro del team: il cliente deve usarne un'altra.");
    return u.id;
  }
  // La password vera nasce all'attivazione: fino ad allora nessuno entra.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: nuovaPassword() + nuovaPassword(),
    email_confirm: true,
    user_metadata: { nombre: nome },
  });
  if (error || !data.user) {
    await logError("contratti:pagamento:account", error ?? "utente non creato", { id: contrattoId });
    throw new HttpError(500, "Non sono riuscito a creare l'account del cliente. Riprova.");
  }
  return data.user.id;
}

export interface EsitoPagamento {
  cliente_id: string;
  fattura_id: string;
}

export async function registraPagamento(admin: SupabaseClient, id: string, pagatoIl: unknown): Promise<EsitoPagamento> {
  const oggi = oggiInItalia();
  const pagato_il = typeof pagatoIl === "string" && pagatoIl.trim() ? pagatoIl.trim() : oggi;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pagato_il)) throw new HttpError(400, "Data del pagamento non valida.");
  if (pagato_il > oggi) throw new HttpError(400, "La data del pagamento non può essere nel futuro.");

  const c = await contrattoDa(admin, id);
  if (c.stato !== "firmato") throw new HttpError(409, "Si può segnare il pagamento solo di un contratto firmato.");
  if (!c.tipo || !c.cliente_email) throw new HttpError(409, "Al contratto mancano i dati del cliente.");

  const dati = c.dati as DatiCliente;
  const email = c.cliente_email.toLowerCase();
  const clienteId = await accountPer(admin, email, nomePartecipante(c.tipo, dati), id);

  // Scheda: contatti, social, tag del programma e il segnale «da attivare». La riga clienti nasce dal trigger handle_new_user.
  const { data: scheda } = await admin.from("clienti").select("tags, telefono, instagram, tiktok").eq("id", clienteId).maybeSingle();
  const s = (scheda ?? {}) as { tags?: string[] | null; telefono?: string | null; instagram?: string | null; tiktok?: string | null };
  const tags = [...new Set([...(s.tags ?? []), c.programma])];
  await admin.from("tags").upsert({ label: c.programma }, { onConflict: "label", ignoreDuplicates: true });
  const { error: errScheda } = await admin
    .from("clienti")
    .upsert(
      {
        id: clienteId,
        telefono: dati.telefono || s.telefono || null,
        instagram: dati.instagram || s.instagram || null,
        tiktok: dati.tiktok || s.tiktok || null,
        tags,
        da_attivare: true,
      },
      { onConflict: "id" },
    );
  if (errScheda) {
    await logError("contratti:pagamento:scheda", errScheda, { id, clienteId });
    throw new HttpError(500, "Account creato, ma non sono riuscito a compilare la scheda. Riprova.");
  }

  // Fattura incassata, come quando la si aggiunge dalla scheda (il PDF, se c'è, lo carica il gestionale dopo).
  const { data: fattura, error: errFatt } = await admin
    .from("fatture")
    .insert({ cliente_id: clienteId, descrizione: `Programma ${c.programma}`, importo: c.prezzo, emessa_il: pagato_il, pagata: true, pagata_il: pagato_il })
    .select("id")
    .single();
  if (errFatt || !fattura) {
    await logError("contratti:pagamento:fattura", errFatt ?? "nessuna riga", { id, clienteId });
    throw new HttpError(500, "Non sono riuscito a registrare l'incasso. Riprova.");
  }
  const fatturaId = (fattura as { id: string }).id;

  // Il contratto passa a «pagato»: da qui resta solo l'attivazione.
  const { data: aggiornati, error: errContr } = await admin
    .from("contratti")
    .update({ stato: "pagato", pagato_il, cliente_id: clienteId, fattura_id: fatturaId })
    .eq("id", id)
    .eq("stato", "firmato")
    .select("id");
  if (errContr || !aggiornati || aggiornati.length === 0) {
    // Niente incasso doppio se si riprova: si toglie la fattura appena scritta.
    await admin.from("fatture").delete().eq("id", fatturaId);
    if (errContr) await logError("contratti:pagamento:contratto", errContr, { id });
    throw new HttpError(409, "Il contratto è cambiato nel frattempo: ricarica la pagina.");
  }
  return { cliente_id: clienteId, fattura_id: fatturaId };
}

export interface EsitoAttivazione {
  cliente_id: string;
  email: string | null;
  /** Presente solo se l'account è nuovo: si vede una volta sola. */
  password: string | null;
  nome: string | null;
  scade_il: string;
  recesso_fino_al: string | null;
}

export async function attivaProgramma(admin: SupabaseClient, id: string, spuntate: unknown): Promise<EsitoAttivazione> {
  const fatte = Array.isArray(spuntate) ? spuntate.filter((v): v is string => typeof v === "string") : [];
  const mancanti = CONSEGNE_ATTIVAZIONE.filter((k) => !fatte.includes(k.id));
  if (mancanti.length > 0) throw new HttpError(400, `Prima completa le consegne: ${mancanti.map((m) => m.label).join("; ")}.`);

  const c = await contrattoDa(admin, id);
  if (c.stato !== "pagato" || !c.cliente_id || !c.tipo) throw new HttpError(409, "Si può attivare solo un contratto pagato.");

  const oggi = oggiInItalia();
  const scade_il = piuMesi(oggi, c.durata_mesi);
  // Il diritto di recesso (14 giorni dall'attivazione) esiste solo per i privati.
  const recesso_fino_al = c.tipo === "privato" ? piuGiorni(oggi, 14) : null;

  const { data: aggiornati, error: errContr } = await admin
    .from("contratti")
    .update({ stato: "attivo", attivato_il: new Date().toISOString(), attivazione_consegne: CONSEGNE_ATTIVAZIONE.map((k) => k.id), scade_il, recesso_fino_al })
    .eq("id", id)
    .eq("stato", "pagato")
    .select("id");
  if (errContr || !aggiornati || aggiornati.length === 0) {
    if (errContr) await logError("contratti:attiva", errContr, { id });
    throw new HttpError(409, "Il contratto è cambiato nel frattempo: ricarica la pagina.");
  }

  const { error: errScheda } = await admin.from("clienti").update({ da_attivare: false, data_inizio: oggi }).eq("id", c.cliente_id);
  if (errScheda) await logError("contratti:attiva:scheda", errScheda, { id }, { silent: true });

  // Credenziali: solo se il cliente non è mai entrato (account nato dal contratto).
  let password: string | null = null;
  const { data: utente } = await admin.auth.admin.getUserById(c.cliente_id);
  if (utente?.user && !utente.user.last_sign_in_at) {
    password = nuovaPassword();
    const { error: errPw } = await admin.auth.admin.updateUserById(c.cliente_id, { password });
    if (errPw) {
      await logError("contratti:attiva:password", errPw, { id });
      password = null;
    }
  }

  const dati = c.dati as DatiCliente;
  const nome = c.tipo === "societa" ? (dati as DatiSocieta).partecipante_nome : (dati as { nome?: string }).nome ?? null;
  return { cliente_id: c.cliente_id, email: c.cliente_email, password, nome: nome ?? null, scade_il, recesso_fino_al };
}
