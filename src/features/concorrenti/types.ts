import { Facebook, Globe, Instagram, Linkedin, Music2, Twitter, Youtube, type LucideIcon } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export type VideoConcorrente = Tables<"concorrenti_video">;
/** Una referenza del cliente con i suoi video, in ordine. */
export type Concorrente = Tables<"concorrenti"> & { video: VideoConcorrente[] };

/** Tipo di referenza (CHECK della colonna `concorrenti.tipo`). */
export const TIPI_CONCORRENTE = [
  { valore: "competitor", etichetta: "Competitor", plurale: "Competitor", testo: "Chi fa quello che fai tu e parla ai tuoi stessi clienti." },
  { valore: "ispirazione", etichetta: "Ispirazione", plurale: "Ispirazioni", testo: "Profili da cui prendere spunto, anche fuori dal tuo settore." },
] as const;
export type TipoConcorrente = (typeof TIPI_CONCORRENTE)[number]["valore"];

/** Massimo di link social per referenza (stesso CHECK della tabella). */
export const MAX_SOCIAL = 3;
/** Massimo di video per referenza (stesso limite del trigger). */
export const MAX_VIDEO = 30;

export interface PiattaformaLink {
  etichetta: string;
  Icona: LucideIcon;
}

const PIATTAFORME: Array<{ dominio: RegExp; etichetta: string; Icona: LucideIcon }> = [
  { dominio: /(^|\.)instagram\.com$/, etichetta: "Instagram", Icona: Instagram },
  // lucide non ha TikTok: la nota musicale, come in Pubblicazioni.
  { dominio: /(^|\.)tiktok\.com$/, etichetta: "TikTok", Icona: Music2 },
  { dominio: /(^|\.)(youtube\.com|youtu\.be)$/, etichetta: "YouTube", Icona: Youtube },
  { dominio: /(^|\.)(facebook\.com|fb\.watch)$/, etichetta: "Facebook", Icona: Facebook },
  { dominio: /(^|\.)linkedin\.com$/, etichetta: "LinkedIn", Icona: Linkedin },
  { dominio: /(^|\.)(x\.com|twitter\.com)$/, etichetta: "X", Icona: Twitter },
];

/** Da un link: nome della piattaforma e icona (sito generico se non la riconosce). */
export function piattaformaDi(url: string): PiattaformaLink {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return { etichetta: "Link", Icona: Globe };
  }
  return PIATTAFORME.find((p) => p.dominio.test(host)) ?? { etichetta: host || "Sito", Icona: Globe };
}

/** «instagram.com/x» → «https://instagram.com/x»: chi incolla un link spesso dimentica il protocollo. */
export function conProtocollo(url: string): string {
  const pulito = url.trim();
  return pulito === "" || /^https?:\/\//i.test(pulito) ? pulito : `https://${pulito}`;
}
