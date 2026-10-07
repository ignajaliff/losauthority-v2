/**
 * La firma tracciata sullo schermo: si tiene solo la FORMA del segno
 * (Ramer-Douglas-Peucker), mai tempi o pressione. Stesso controllo nel browser
 * e sul server.
 */

import type { Firma } from "./tipi.ts";

const MAX_TRATTI = 400;
const MAX_PUNTI = 30000;

/**
 * Tiene di un tratto solo i punti che ne fanno la forma (Ramer-Douglas-Peucker).
 * Serve a due cose: alleggerire la firma e togliere ogni traccia della
 * VELOCITÀ con cui è stata scritta (i punti fitti dove la mano rallenta), così
 * resta davvero solo il disegno e non un dato del gesto.
 */
function soloForma(p: number[], tolleranza: number): number[] {
  const n = p.length / 2;
  if (n < 3) return p;
  const tieni = new Uint8Array(n);
  tieni[0] = 1;
  tieni[n - 1] = 1;
  const pila: [number, number][] = [[0, n - 1]];
  while (pila.length > 0) {
    const [a, b] = pila.pop() as [number, number];
    const ax = p[a * 2];
    const ay = p[a * 2 + 1];
    const dx = p[b * 2] - ax;
    const dy = p[b * 2 + 1] - ay;
    const lungo = Math.hypot(dx, dy);
    let max = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = lungo
        ? Math.abs(dy * (p[i * 2] - ax) - dx * (p[i * 2 + 1] - ay)) / lungo
        : Math.hypot(p[i * 2] - ax, p[i * 2 + 1] - ay);
      if (d > max) {
        max = d;
        idx = i;
      }
    }
    if (idx > 0 && max > tolleranza) {
      tieni[idx] = 1;
      pila.push([a, idx], [idx, b]);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (tieni[i]) out.push(p[i * 2], p[i * 2 + 1]);
  return out;
}

/**
 * Ripulisce una firma arrivata dal browser: solo numeri, dentro il riquadro,
 * con un tetto a tratti e punti, e ridotta alla sola forma del segno.
 * Ritorna null se è vuota o non è una firma.
 */
export function validaFirma(grezzo: unknown): Firma | null {
  if (!grezzo || typeof grezzo !== "object") return null;
  const f = grezzo as { w?: unknown; h?: unknown; tratti?: unknown };
  const w = Number(f.w);
  const h = Number(f.h);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 50 || h < 30 || w > 4000 || h > 4000) return null;
  if (!Array.isArray(f.tratti) || f.tratti.length === 0 || f.tratti.length > MAX_TRATTI) return null;

  const tratti: number[][] = [];
  let punti = 0;
  let lunghezza = 0;
  for (const t of f.tratti) {
    if (!Array.isArray(t) || t.length < 2 || t.length % 2 !== 0) continue;
    const pulito: number[] = [];
    for (let i = 0; i < t.length; i += 2) {
      const x = Number(t[i]);
      const y = Number(t[i + 1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      const cx = Math.round(Math.min(Math.max(x, 0), w) * 10) / 10;
      const cy = Math.round(Math.min(Math.max(y, 0), h) * 10) / 10;
      if (pulito.length >= 2) {
        lunghezza += Math.hypot(cx - pulito[pulito.length - 2], cy - pulito[pulito.length - 1]);
      }
      pulito.push(cx, cy);
    }
    punti += pulito.length / 2;
    if (punti > MAX_PUNTI) return null;
    tratti.push(soloForma(pulito, Math.max(w, h) / 1500));
  }
  // Un puntino o un tocco per sbaglio non sono una firma.
  if (tratti.length === 0 || lunghezza < Math.min(w, h) * 0.6) return null;
  return { w: Math.round(w), h: Math.round(h), tratti };
}
