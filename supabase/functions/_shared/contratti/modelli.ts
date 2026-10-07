/**
 * I modelli di contratto disponibili. Un'offerta (nome + prezzo, creata dal
 * gestionale) usa uno di questi modelli. I TESTI stanno nel codice: per
 * aggiungere il contratto di un altro programma si scrive il suo testo, lo si
 * registra qui e lo si aggancia in `componi.ts`.
 */
export const MODELLI_CONTRATTO = {
  upscale: {
    /** Come compare nel menu quando si crea un'offerta. */
    nome: "Contratto Programma UPSCALE (6 mesi)",
    /** Nome del programma: finisce nel tag del cliente e nella fattura. */
    programma: "UPSCALE",
    durataMesi: 6,
  },
} as const;

export type ModelloContratto = keyof typeof MODELLI_CONTRATTO;

export function modelloValido(v: string): v is ModelloContratto {
  return Object.prototype.hasOwnProperty.call(MODELLI_CONTRATTO, v);
}
