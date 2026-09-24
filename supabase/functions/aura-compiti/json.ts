/**
 * Estrazione robusta del JSON prodotto dal modello (porta di src/lib/ai/json.ts).
 * Aura scrive in italiano e ogni tanto usa le virgolette dentro ai testi,
 * producendo JSON non valido (~1 volta su 5): isoliamo l'oggetto e, se il parse
 * fallisce, ripariamo le virgolette interne non escapate prima di arrenderci.
 */

/**
 * Escapa le virgolette doppie DENTRO un valore stringa. Regola: dentro una
 * stringa, un `"` chiude davvero solo se il primo carattere non-spazio che segue
 * è uno di `, } ] :` oppure la fine del testo.
 */
function escapeInnerQuotes(s: string): string {
  let out = "";
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\\") {
      out += ch + (s[i + 1] ?? "");
      i++;
      continue;
    }
    if (ch !== '"') {
      out += ch;
      continue;
    }
    if (!inString) {
      inString = true;
      out += ch;
      continue;
    }
    let j = i + 1;
    while (j < s.length && /\s/.test(s[j])) j++;
    const next = s[j];
    if (next === undefined || next === "," || next === "}" || next === "]" || next === ":") {
      inString = false;
      out += ch;
    } else {
      out += '\\"';
    }
  }
  return out;
}

/** Ritaglia il primo oggetto JSON completo del testo (tollera ```json ... ```). */
function sliceObject(raw: string): string | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  return start >= 0 && end > start ? raw.slice(start, end + 1) : null;
}

/** Estrae un oggetto JSON dal testo del modello, riparando se serve. null se irrecuperabile. */
export function parseModelJson<T = Record<string, unknown>>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  const body = sliceObject(raw);
  if (!body) return null;
  try {
    return JSON.parse(body) as T;
  } catch {
    /* proviamo a riparare */
  }
  try {
    return JSON.parse(escapeInnerQuotes(body)) as T;
  } catch {
    return null;
  }
}
