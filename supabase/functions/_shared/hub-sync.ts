/**
 * Sync dei COMPITI di UN cliente dall'hub Notion → hub_board + hub_compiti
 * (porta di notion/compiti.ts + compiti-sync.ts). Riusa gli id delle board già
 * in hub_board (sync veloce) e riscopre la struttura se una board sparisce.
 * Poi allinea clienti.fase alla call corrente: SOLO in avanti, mai da/verso
 * 'completato' (la chiusura del percorso resta una decisione di Wesley).
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { discoverHub, hubPageId, queryDatabase, type Riga, rowAssignees, rowDue, rowStatus, rowTitle, rowUrl } from "./notion.ts";
import { logError } from "./log.ts";

const NOTION_WESLEY_USER_ID = Deno.env.get("NOTION_WESLEY_USER_ID") ?? "";
/** Prefisso [WESLEY] nei titoli dei compiti che Aura assegna a Wesley. */
export const WESLEY_PREFIX = /^\s*\[\s*wesley\s*\]\s*/i;

export type StatoCompito = "not_started" | "in_progress" | "done";

export interface EsitoSync {
  ok: boolean;
  /** Compiti letti (tutte le board). */
  letti?: number;
  error?: string;
}

interface BoardRef {
  call: number;
  dbId: string;
}
interface BoardLetta extends BoardRef {
  rows: Riga[];
}
interface BoardNota {
  call_n: number;
  notion_db_id: string;
}

const statoDa = (s: string): StatoCompito => (s === "Done" ? "done" : s === "In progress" ? "in_progress" : "not_started");

/** Wesley se Assigned To contiene il suo utente Notion o il titolo inizia con [WESLEY]. */
function assegnatoA(row: Riga, titolo: string): "wesley" | "cliente" {
  if (WESLEY_PREFIX.test(titolo)) return "wesley";
  for (const a of rowAssignees(row)) {
    if (NOTION_WESLEY_USER_ID && a.id === NOTION_WESLEY_USER_ID) return "wesley";
    // Senza id configurato: la regola del vecchio sistema (nome/email).
    if (!NOTION_WESLEY_USER_ID && /wesley|caicedo/i.test(`${a.name} ${a.email ?? ""}`)) return "wesley";
  }
  return "cliente";
}

const scoperta = async (hubId: string): Promise<BoardRef[]> => {
  const d = await discoverHub(hubId);
  const refs: BoardRef[] = d.boards.map((b) => ({ call: b.call, dbId: b.id })).filter((b) => b.call >= 1 && b.call <= 4);
  if (d.todoId) refs.push({ call: 0, dbId: d.todoId });
  return refs;
};

/** Legge le board note; se una non risponde, riscopre UNA volta e riprova. */
async function leggiBoards(hubId: string, note: BoardRef[]): Promise<BoardLetta[]> {
  let refs = note;
  let riscoperto = false;
  if (refs.length === 0) {
    refs = await scoperta(hubId);
    riscoperto = true;
  }
  for (;;) {
    const lette: BoardLetta[] = [];
    let fallita = false;
    for (const ref of refs) {
      const { ok, rows } = await queryDatabase(ref.dbId);
      if (!ok) {
        fallita = true;
        if (!riscoperto) break;
        continue;
      }
      lette.push({ ...ref, rows });
    }
    if (fallita && !riscoperto) {
      refs = await scoperta(hubId);
      riscoperto = true;
      continue;
    }
    return lette;
  }
}

async function salvaBoard(admin: SupabaseClient, clienteId: string, b: BoardLetta): Promise<number> {
  const { data, error } = await admin
    .from("hub_board")
    .upsert(
      { cliente_id: clienteId, call_n: b.call, notion_db_id: b.dbId, synced_at: new Date().toISOString() },
      { onConflict: "cliente_id,call_n" },
    )
    .select("id")
    .single();
  if (error) throw error;
  const boardId = (data as { id: string }).id;

  const righe = b.rows.map((row, i) => {
    const grezzo = rowTitle(row);
    return {
      board_id: boardId,
      notion_page_id: row.id,
      titolo: (grezzo.replace(WESLEY_PREFIX, "").trim() || "(senza titolo)").slice(0, 500),
      stato: statoDa(rowStatus(row)),
      assegnato_a: assegnatoA(row, grezzo),
      scadenza: rowDue(row)?.slice(0, 10) ?? null,
      link_utile: rowUrl(row),
      ordine: i,
    };
  });
  if (righe.length > 0) {
    const { error: eUp } = await admin.from("hub_compiti").upsert(righe, { onConflict: "notion_page_id" });
    if (eUp) throw eUp;
  }
  // Compiti spariti dalla board (cancellati/spostati su Notion).
  let del = admin.from("hub_compiti").delete().eq("board_id", boardId);
  if (righe.length > 0) del = del.not("notion_page_id", "in", `(${righe.map((r) => r.notion_page_id).join(",")})`);
  const { error: eDel } = await del;
  if (eDel) throw eDel;
  return righe.length;
}

/** Ordine delle fasi del percorso (deve seguire il CHECK di clienti.fase). */
const ORDINE_FASI = ["onboarding", "call_1", "call_2", "call_3", "call_4", "completato"];

/** Call corrente: la prima (1..4) con compiti aperti, altrimenti l'ultima con compiti. */
export function callCorrente(boards: Array<{ call: number; totale: number; fatti: number }>): number | null {
  const conBoard = boards.filter((b) => b.call >= 1 && b.call <= 4 && b.totale > 0).sort((a, b) => a.call - b.call);
  return conBoard.find((b) => b.fatti < b.totale)?.call ?? (conBoard.length ? conBoard[conBoard.length - 1].call : null);
}

async function allineaFase(admin: SupabaseClient, clienteId: string, call: number | null): Promise<void> {
  if (!call || call < 1 || call > 4) return;
  const target = `call_${call}`;
  const { data } = await admin.from("clienti").select("fase").eq("id", clienteId).maybeSingle();
  const attuale = (data as { fase: string } | null)?.fase ?? "onboarding";
  if (attuale === "completato") return;
  if (ORDINE_FASI.indexOf(attuale) >= ORDINE_FASI.indexOf(target)) return;
  const { error } = await admin.from("clienti").update({ fase: target }).eq("id", clienteId);
  if (error) await logError("notion-compiti:fase", error, { clienteId, da: attuale, a: target });
}

/** Sincronizza un cliente. Non lancia mai: un fallimento → logError silent + esito. */
export async function syncCliente(admin: SupabaseClient, clienteId: string, hubUrl: string): Promise<EsitoSync> {
  const hubId = hubPageId(hubUrl);
  if (!hubId) return { ok: false, error: "URL dell'hub non valido" };

  const { data: noteRaw } = await admin.from("hub_board").select("call_n, notion_db_id").eq("cliente_id", clienteId);
  const note: BoardRef[] = ((noteRaw ?? []) as BoardNota[]).map((b) => ({ call: b.call_n, dbId: b.notion_db_id }));

  let boards: BoardLetta[];
  try {
    boards = await leggiBoards(hubId, note);
  } catch (e) {
    // Contrattempo passeggero (di solito Notion lento): registrato, non notificato.
    await logError("notion-compiti:lettura", e, { clienteId }, { silent: true });
    return { ok: false, error: "Errore di lettura da Notion" };
  }
  if (boards.length === 0) {
    await logError("notion-compiti:struttura", "nessuna board trovata nell'hub", { clienteId }, { silent: true });
    return { ok: false, error: "Hub non leggibile (token, URL o struttura)" };
  }

  try {
    let letti = 0;
    for (const b of boards) letti += await salvaBoard(admin, clienteId, b);
    // Board non più presenti nell'hub → via anche la fotografia (cascade sui compiti).
    const calls = boards.map((b) => b.call);
    const { error: eDel } = await admin
      .from("hub_board")
      .delete()
      .eq("cliente_id", clienteId)
      .not("call_n", "in", `(${calls.join(",")})`);
    if (eDel) throw eDel;

    await allineaFase(
      admin,
      clienteId,
      callCorrente(boards.map((b) => ({ call: b.call, totale: b.rows.length, fatti: b.rows.filter((r) => rowStatus(r) === "Done").length }))),
    );
    return { ok: true, letti };
  } catch (e) {
    await logError("notion-compiti:salvataggio", e, { clienteId }, { silent: true });
    return { ok: false, error: "Errore di salvataggio" };
  }
}

export interface ClienteConHub {
  id: string;
  notion_hub_url: string;
}

/** Tutti i clienti con un hub Notion collegato. */
export async function clientiConHub(admin: SupabaseClient): Promise<ClienteConHub[]> {
  const { data, error } = await admin.from("clienti").select("id, notion_hub_url").not("notion_hub_url", "is", null);
  if (error) throw error;
  return ((data ?? []) as ClienteConHub[]).filter((c) => !!c.notion_hub_url);
}
