/**
 * Le due fasi con Claude: prima le TAPPE del piano (JSON piccolo e affidabile),
 * poi i SOTTO-COMPITI di ogni tappa in parallelo, col piano nel contesto. Ogni
 * fase ha un secondo tentativo se resta tempo: tutte le chiamate condividono
 * una SCADENZA (la funzione ha ~150 s in tutto), così un'elaborazione lenta
 * finisce in `errore` invece di morire a metà e restare `in_corso`. Se la
 * seconda fase fallisce la tappa non va persa: resta con un solo sotto-compito
 * preso dal suo focus.
 */
import { streamAnthropicText } from "../_shared/anthropic.ts";
import { logError } from "../_shared/log.ts";
import { paginaArea } from "../_shared/area/pagine.ts";
import type { ContestoCliente } from "./contesto.ts";
import { parseModelJson } from "./json.ts";
import { type CallLetta, promptSottoCompiti, promptTappe, SYSTEM_PIANO, type TappaPiano } from "./prompt.ts";
import type { SottoCompito } from "./scrivi.ts";

const MAX_TAPPE = 8;
const MIN_TAPPE = 2;
const MAX_SOTTO = 6;
const MAX_TITOLO = 120;
const MAX_TESTO = 400;
const MAX_NOTA = 100;
const TENTATIVI = 2;
/** Tempo massimo di una singola chiamata a Claude e minimo per provarci ancora. */
const MAX_CHIAMATA_MS = 50_000;
const MIN_CHIAMATA_MS = 8_000;

/** Quanto tempo dare alla prossima chiamata: 0 se la scadenza è troppo vicina. */
function tempoDisponibile(scadenza: number): number {
  const resto = scadenza - Date.now();
  return resto < MIN_CHIAMATA_MS ? 0 : Math.min(MAX_CHIAMATA_MS, resto);
}

/** Via numerazione o puntini in testa ("1.", "-", "•"): li mette il gestionale. */
const pulisci = (t: unknown): string =>
  String(t ?? "")
    .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

const oggetti = (v: unknown): Array<Record<string, unknown>> =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : [];

function leggiTappe(raw: string | null): TappaPiano[] {
  const obj = parseModelJson<{ tappe?: unknown }>(raw);
  return oggetti(obj?.tappe)
    .map((t) => ({ titolo: pulisci(t.titolo).slice(0, MAX_TITOLO), focus: pulisci(t.focus).slice(0, 600) }))
    .filter((t) => t.titolo.length > 2)
    .slice(0, MAX_TAPPE);
}

/** Fase 1: le tappe. null se Aura non risponde con almeno due tappe nel tempo che resta. */
export async function generaTappe(ctx: ContestoCliente, call: CallLetta, scadenza: number): Promise<TappaPiano[] | null> {
  for (let tentativo = 0; tentativo < TENTATIVI; tentativo++) {
    const timeoutMs = tempoDisponibile(scadenza);
    if (timeoutMs === 0) break;
    const raw = await streamAnthropicText({
      system: SYSTEM_PIANO,
      user: promptTappe(ctx, call),
      maxTokens: 2000,
      tag: "piano-tappe",
      utente: ctx.clienteId,
      timeoutMs,
    });
    const tappe = leggiTappe(raw);
    if (tappe.length >= MIN_TAPPE) return tappe;
  }
  return null;
}

function leggiSottoCompiti(raw: string | null, ctx: ContestoCliente): SottoCompito[] {
  const obj = parseModelJson<{ compiti?: unknown }>(raw);
  return oggetti(obj?.compiti)
    .map((c) => {
      // Lezione scelta per numero (1-based) dal catalogo: l'URL viene sempre dal catalogo, mai dal modello.
      const idx = Number(c.lezione);
      const lezione = Number.isInteger(idx) && idx >= 1 && idx <= ctx.lezioni.length ? ctx.lezioni[idx - 1] : null;
      const nota = lezione ? pulisci(c.nota).slice(0, MAX_NOTA) : "";
      // Pagina dell'area solo se è una chiave della lista condivisa (è anche il check della colonna).
      const pagina = typeof c.pagina === "string" && paginaArea(c.pagina.trim()) ? c.pagina.trim() : null;
      return { testo: pulisci(c.testo).slice(0, MAX_TESTO), lezione, nota: nota || null, pagina };
    })
    .filter((c) => c.testo.length > 3)
    .slice(0, MAX_SOTTO);
}

/** Fase 2: i sotto-compiti della tappa `indice`. Mai vuoto: in fallback uno solo, dal focus della tappa. */
export async function generaSottoCompiti(
  ctx: ContestoCliente,
  call: CallLetta,
  tappe: TappaPiano[],
  indice: number,
  scadenza: number,
): Promise<SottoCompito[]> {
  for (let tentativo = 0; tentativo < TENTATIVI; tentativo++) {
    const timeoutMs = tempoDisponibile(scadenza);
    if (timeoutMs === 0) break;
    const raw = await streamAnthropicText({
      system: SYSTEM_PIANO,
      user: promptSottoCompiti(ctx, call, tappe, indice),
      maxTokens: 1500,
      tag: "piano-sotto-compiti",
      utente: ctx.clienteId,
      timeoutMs,
    });
    const sotto = leggiSottoCompiti(raw, ctx);
    if (sotto.length > 0) return sotto;
  }
  const tappa = tappe[indice];
  await logError("aura-compiti:sotto-compiti", "non generati, resta il focus della tappa", { tappa: tappa.titolo.slice(0, 80) }, { silent: true });
  return [{ testo: (tappa.focus || tappa.titolo).slice(0, MAX_TESTO), lezione: null, nota: null, pagina: null }];
}
