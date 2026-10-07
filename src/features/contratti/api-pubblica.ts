/**
 * La pagina pubblica del contratto parla con la Edge Function `contratto-pubblico`
 * senza login: la chiave è il token del link. Niente client Supabase qui (non c'è
 * sessione): fetch diretta, con una sola riprova sui cali di rete come invocaEdge.
 */
import type { DatiCliente, DocumentoContratto, Firma, StatoContratto, TipoCliente } from "@contratti/tipi.ts";
import type { Errori } from "@contratti/validazione.ts";

const BASE = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1/contratto-pubblico`;

export interface StatoInvito {
  stato: StatoContratto;
  programma: string;
  durata_mesi: number;
  tipo: TipoCliente | null;
  dati: Partial<DatiCliente> | null;
  firma_fornitore: Firma | null;
  firmato_il: string | null;
  istruzioni_pagamento: string | null;
}

export interface EsitoDati {
  documento: DocumentoContratto;
  sha: string;
}

export type RispostaPubblica<T> =
  | ({ ok: true } & T)
  | { ok: false; status: number; error: string; errori?: Errori; documento?: DocumentoContratto; sha?: string };

const MSG_RETE = "Connessione assente. Controlla la rete e riprova.";

async function post<T>(body: Record<string, unknown>, secondoTentativo = false): Promise<RispostaPubblica<T>> {
  let res: Response;
  try {
    res = await fetch(BASE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    if (!secondoTentativo) {
      await new Promise((r) => setTimeout(r, 700));
      return post<T>(body, true);
    }
    return { ok: false, status: 0, error: MSG_RETE };
  }
  const json = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; error?: string }) | null;
  if (!res.ok || !json?.ok) {
    return {
      ok: false,
      status: res.status,
      error: json?.error ?? "Qualcosa non ha funzionato. Riprova tra un momento.",
      errori: json?.errori as Errori | undefined,
      documento: json?.documento as DocumentoContratto | undefined,
      sha: json?.sha as string | undefined,
    };
  }
  return json as unknown as { ok: true } & T;
}

export const apriInvito = (token: string) => post<StatoInvito>({ token, azione: "apri" });

export const inviaDati = (token: string, tipo: TipoCliente, dichiarazione: boolean, informativa: boolean, dati: Record<string, unknown>) =>
  post<EsitoDati>({ token, azione: "dati", tipo, dichiarazione, informativa, dati });

export const inviaFirma = (token: string, firma_contratto: Firma, firma_clausole: Firma, sha: string) =>
  post<{ firmato_il: string }>({ token, azione: "firma", firma_contratto, firma_clausole, accetto: true, approvo: true, sha });

/** Il PDF firmato: la risposta è un allegato, quindi si naviga e la pagina resta dov'è. */
export const urlPdfPubblico = (token: string) => `${BASE}?token=${encodeURIComponent(token)}&pdf=1`;
