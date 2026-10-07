/** JSON "sporco" dal modello: parsing tollerante e riparazione di un oggetto troncato. */

/** Parsa un JSON; null se non valido. */
export function leggiJson(testo: string): unknown | null {
  try {
    return JSON.parse(testo);
  } catch {
    return null;
  }
}

/** Il primo oggetto JSON in un testo (tra la prima { e l'ultima }), anche dentro un blocco di codice. */
export function estraiOggetto(testo: string): unknown | null {
  const a = testo.indexOf("{");
  const b = testo.lastIndexOf("}");
  if (a === -1 || b === -1 || b <= a) return null;
  const pezzo = testo.slice(a, b + 1);
  return leggiJson(pezzo) ?? riparaJson(pezzo);
}

/**
 * Oggetto troncato (il modello ha finito i token a metà): taglia all'ultima
 * virgola e chiude le graffe, finché non torna un JSON valido. null se non ce la fa.
 */
export function riparaJson(testo: string): unknown | null {
  let t = testo;
  for (let i = 0; i < 300; i++) {
    const virgola = t.lastIndexOf(",");
    if (virgola <= 0) return null;
    t = t.slice(0, virgola);
    const aperte = (t.match(/\{/g) ?? []).length - (t.match(/\}/g) ?? []).length;
    const quadre = (t.match(/\[/g) ?? []).length - (t.match(/\]/g) ?? []).length;
    const json = leggiJson(`${t}${"]".repeat(Math.max(quadre, 0))}${"}".repeat(Math.max(aperte, 0))}`);
    if (json && typeof json === "object") return json;
  }
  return null;
}
