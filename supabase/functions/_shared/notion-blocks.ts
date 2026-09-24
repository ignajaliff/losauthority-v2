/**
 * Blocchi Notion: markdown "leggero" → blocchi (porta di src/lib/notion/blocks.ts)
 * e corpo di un compito nel formato voluto da Wesley (porta di compiti-write.ts):
 * callout ⏱️ tempo · 🎯 obiettivo · 📚 lezione · STEP con checklist · ✅ test · 📞 call.
 */

const LIMITE_TESTO = 1900;

/** `**grassetto**` → rich_text con annotazione bold. */
function richText(line: string): unknown[] {
  const out: unknown[] = [];
  const parti = line.split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0);
  let usati = 0;
  for (const p of parti) {
    if (usati >= LIMITE_TESTO) break;
    const bold = p.startsWith("**") && p.endsWith("**") && p.length > 4;
    const testo = (bold ? p.slice(2, -2) : p).slice(0, LIMITE_TESTO - usati);
    if (!testo) continue;
    usati += testo.length;
    out.push({ type: "text", text: { content: testo }, annotations: bold ? { bold: true } : undefined });
  }
  return out.length > 0 ? out : [{ type: "text", text: { content: line.slice(0, LIMITE_TESTO) } }];
}

const blocco = (type: string, extra: Record<string, unknown> = {}) => (line: string) => ({
  object: "block",
  type,
  [type]: { rich_text: richText(line), ...extra },
});

const paragrafo = blocco("paragraph");
const h2 = blocco("heading_2");
const h3 = blocco("heading_3");
const punto = blocco("bulleted_list_item");
const numero = blocco("numbered_list_item");
const citazione = blocco("quote");
const spunta = blocco("to_do", { checked: false });
const divisore = { object: "block", type: "divider", divider: {} };

/**
 * Converte il markdown in blocchi. `max` protegge dal limite Notion di 100
 * blocchi per richiesta (il chiamante può spezzare in più chiamate).
 */
export function mdToBlocks(md: string, max = 95): unknown[] {
  const blocchi: unknown[] = [];
  for (const raw of md.split("\n")) {
    if (blocchi.length >= max) break;
    const t = raw.trimEnd().trim();
    if (!t) continue;
    if (t === "---" || t === "***") blocchi.push(divisore);
    else if (/^#{4,}\s+/.test(t)) blocchi.push(h3(t.replace(/^#+\s+/, "")));
    else if (/^###\s+/.test(t)) blocchi.push(h3(t.replace(/^###\s+/, "")));
    else if (/^##?\s+/.test(t)) blocchi.push(h2(t.replace(/^#+\s+/, "")));
    else if (/^[-*]\s+\[[ xX]\]\s+/.test(t)) blocchi.push(spunta(t.replace(/^[-*]\s+\[[ xX]\]\s+/, "")));
    else if (/^[-*+]\s+/.test(t)) blocchi.push(punto(t.replace(/^[-*+]\s+/, "")));
    else if (/^\d+[.)]\s+/.test(t)) blocchi.push(numero(t.replace(/^\d+[.)]\s+/, "")));
    else if (/^>\s?/.test(t)) blocchi.push(citazione(t.replace(/^>\s?/, "")));
    else blocchi.push(paragrafo(t));
  }
  return blocchi;
}

/* ---------------- Corpo di un compito (formato Wesley) ---------------- */

export interface CompitoStep {
  /** Titolo dello step, es. "STEP 1 — Instagram (30 min)". */
  titolo: string;
  /** Una riga breve di orientamento (opzionale). */
  testo?: string;
  /** Voci di checklist (to-do) dello step — il cuore operativo. */
  check?: string[];
}

export interface CompitoBody {
  /** Callout ⏱️ in cima, es. "~30 min. Dopo il n°1." */
  tempo?: string;
  /** Callout 🎯 in UNA riga: cosa ottieni / perché conta. */
  obiettivo?: string;
  step?: CompitoStep[];
  /** Callout ✅ in UNA riga: "fatto bene se…". */
  test?: string;
  /** Callout 📞 in UNA riga: a cosa serve alla call. */
  inCall?: string;
  /** Lezione Skool da seguire (callout 📚 + proprietà Link utile). */
  lezione?: { titolo: string; corso?: string | null; url?: string | null };
}

const rt = (content: string) => [{ type: "text", text: { content: content.slice(0, LIMITE_TESTO) } }];
const para = (text: string) => ({ object: "block", type: "paragraph", paragraph: { rich_text: rt(text) } });
const titolo3 = (text: string) => ({ object: "block", type: "heading_3", heading_3: { rich_text: rt(text) } });
const todo = (text: string) => ({ object: "block", type: "to_do", to_do: { rich_text: rt(text), checked: false } });
const callout = (emoji: string, text: string, color: string) => ({
  object: "block",
  type: "callout",
  callout: { rich_text: rt(text), icon: { type: "emoji", emoji }, color },
});

const clean = (s: unknown): string => (typeof s === "string" ? s.trim() : "");
const cleanList = (a: unknown, max: number): string[] =>
  Array.isArray(a) ? a.map(clean).filter(Boolean).slice(0, max) : [];

/**
 * Corpo del compito in blocchi Notion — layout snello e scannabile.
 * Limitato a ~95 blocchi (tetto Notion 100 per richiesta).
 */
export function bodyBlocks(body?: CompitoBody): unknown[] {
  if (!body) return [];
  const blocks: unknown[] = [];

  const tempo = clean(body.tempo);
  if (tempo) blocks.push(callout("⏱️", `Tempo: ${tempo}`, "gray_background"));

  const obiettivo = clean(body.obiettivo);
  if (obiettivo) blocks.push(callout("🎯", obiettivo, "blue_background"));

  const lez = body.lezione;
  if (lez && clean(lez.titolo)) {
    const etichetta = `${clean(lez.corso) ? `${clean(lez.corso)} › ` : ""}${clean(lez.titolo)}`;
    const url = clean(lez.url);
    blocks.push({
      object: "block",
      type: "callout",
      callout: {
        rich_text: [
          { type: "text", text: { content: "Lezione da seguire: " } },
          url
            ? { type: "text", text: { content: etichetta.slice(0, 300), link: { url } } }
            : { type: "text", text: { content: etichetta.slice(0, 300) } },
        ],
        icon: { type: "emoji", emoji: "📚" },
        color: "yellow_background",
      },
    });
  }

  if (blocks.length) blocks.push(divisore);

  for (const step of (body.step ?? []).slice(0, 8)) {
    const titolo = clean(step.titolo);
    if (!titolo) continue;
    blocks.push(titolo3(titolo));
    const testo = clean(step.testo);
    if (testo) blocks.push(para(testo));
    for (const c of cleanList(step.check, 10)) blocks.push(todo(c));
    if (blocks.length > 86) break;
  }

  const test = clean(body.test);
  if (test && blocks.length < 92) blocks.push(callout("✅", `Fatto bene se: ${test}`, "green_background"));

  const inCall = clean(body.inCall);
  if (inCall && blocks.length < 94) blocks.push(callout("📞", `Alla call: ${inCall}`, "gray_background"));

  return blocks.slice(0, 95);
}
