import type { Tables } from "@/integrations/supabase/types";

/** Un avatar (cliente ideale) del cliente: carta d'identità + dossier + diagnosi. */
export type Avatar = Tables<"avatar">;
/** Un messaggio della conversazione che compila un avatar (cliente o Aura). */
export type MessaggioAvatar = Tables<"avatar_messaggi">;
/** La lettura di Aura per Wesley su un avatar: la legge solo il team. */
export type DiagnosiAvatar = Tables<"avatar_diagnosi">;

/** Frasi di stato mentre Aura legge e annota sulla carta. */
export const FASI_AVATAR = [
  "Ti sto leggendo…",
  "Annoto sulla carta…",
  "Controllo cosa manca ancora…",
  "Preparo la prossima domanda…",
  "Ancora un attimo…",
] as const;

export const ETICHETTA_ORIGINE: Record<string, string> = {
  clienti_reali: "Estratta da clienti reali",
  costruito: "Costruita da zero",
  misto: "Clienti reali più costruzione",
};

/** Numero di serie sulla carta: AV-0001, AV-0002… (posizione dell'avatar tra quelli del cliente). */
export const codiceAvatar = (numero: number) => `AV-${String(numero).padStart(4, "0")}`;

/** I campi del fronte della carta, per contare quanto è compilata. */
const CAMPI_CARTA = ["nome", "eta", "genere", "situazione", "momento", "origine", "frase"] as const;

export function campiCompilati(a: Avatar): { fatti: number; totale: number } {
  const fatti = CAMPI_CARTA.filter((k) => {
    const v = a[k];
    return typeof v === "string" && v.trim().length > 0;
  }).length;
  return { fatti, totale: CAMPI_CARTA.length };
}

/** Tutto quello che il retro della carta (DossierAvatar) mostra oltre al fronte. */
const DOSSIER_TESTO = ["snapshot", "contesto", "desiderio_pratico", "desiderio_emotivo", "dove_cerca"] as const;
const DOSSIER_LISTE = ["dolori_superficie", "dolori_profondi", "credenze_limitanti", "linguaggio", "piattaforme", "chi_segue", "obiezioni", "trigger_acquisto"] as const;

/** Il dossier ha qualcosa da mostrare (dati o diagnosi)? */
export function haDossier(a: Avatar): boolean {
  // `?? []`: le colonne nuove possono mancare in una riga letta prima di una migrazione.
  return DOSSIER_TESTO.some((k) => !!a[k]?.trim()) || DOSSIER_LISTE.some((k) => (a[k] ?? []).length > 0);
}

const senzaAccenti = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** La riga "leggibile dalla macchina" in fondo alla carta, come su un passaporto: MARTA<<38-48<<MAMMA<DI<DUE<<NUTRIZIONE<<<<< */
export function rigaMrz(a: Avatar): string {
  const pezzi = [a.nome, a.eta, a.situazione, a.settore]
    .filter((v): v is string => !!v && v.trim().length > 0)
    .map((v) => senzaAccenti(v).toUpperCase().replace(/[^A-Z0-9]+/g, "<").replace(/^<+|<+$/g, "").slice(0, 22));
  const testo = pezzi.length > 0 ? pezzi.join("<<") : "CLIENTE<IDEALE";
  return testo.padEnd(44, "<").slice(0, 44);
}
