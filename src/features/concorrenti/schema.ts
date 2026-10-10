import { z } from "zod";
import { conProtocollo, MAX_SOCIAL, MAX_VIDEO, TIPI_CONCORRENTE, type Concorrente, type TipoConcorrente } from "./types";

/** Un link valido (con o senza https://), come lo accetta il database. */
function eLink(v: string): boolean {
  const url = conProtocollo(v);
  if (url.length > 500 || /\s/.test(url)) return false;
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

const LINK_NON_VALIDO = "Incolla un link valido, es. instagram.com/nome";

export const concorrenteSchema = z.object({
  nome: z.string().trim().min(1, "Scrivi il nome").max(120, "Massimo 120 caratteri"),
  tipo: z.enum(TIPI_CONCORRENTE.map((t) => t.valore) as [TipoConcorrente, ...TipoConcorrente[]]),
  /** Sempre MAX_SOCIAL caselle; quelle vuote non si salvano. */
  social: z.array(z.object({ url: z.string().trim().refine((v) => v === "" || eLink(v), LINK_NON_VALIDO) })).max(MAX_SOCIAL),
  cosa_fa: z.string().trim().max(2000, "Massimo 2000 caratteri"),
  video: z
    .array(
      z.object({
        url: z.string().trim().min(1, "Incolla il link del video").refine(eLink, LINK_NON_VALIDO),
        descrizione: z.string().trim().max(2000, "Massimo 2000 caratteri"),
      }),
    )
    .max(MAX_VIDEO, `Massimo ${MAX_VIDEO} video`),
});

export type ConcorrenteFormValues = z.infer<typeof concorrenteSchema>;

/** Valori iniziali del popup: da una referenza esistente o vuoti (tre caselle social, nessun video). */
export function concorrenteToForm(c: Concorrente | null, tipo: TipoConcorrente = "competitor"): ConcorrenteFormValues {
  const social = c?.social ?? [];
  return {
    nome: c?.nome ?? "",
    tipo: c?.tipo === "ispirazione" ? "ispirazione" : c ? "competitor" : tipo,
    social: Array.from({ length: MAX_SOCIAL }, (_, i) => ({ url: social[i] ?? "" })),
    cosa_fa: c?.cosa_fa ?? "",
    video: (c?.video ?? []).map((v) => ({ url: v.url, descrizione: v.descrizione ?? "" })),
  };
}

export interface ArgomentiSalvaConcorrente {
  /** null = nuova referenza. */
  p_id: string | null;
  p_nome: string;
  p_tipo: TipoConcorrente;
  p_social: string[];
  p_cosa_fa: string | null;
  p_video_url: string[];
  p_video_descrizione: string[];
}

/** Argomenti di `salva_concorrente`: link con https://, social vuoti tolti, video in ordine. */
export function formToConcorrente(id: string | null, v: ConcorrenteFormValues): ArgomentiSalvaConcorrente {
  return {
    p_id: id,
    p_nome: v.nome,
    p_tipo: v.tipo,
    p_social: v.social.map((s) => conProtocollo(s.url)).filter(Boolean),
    p_cosa_fa: v.cosa_fa || null,
    p_video_url: v.video.map((x) => conProtocollo(x.url)),
    p_video_descrizione: v.video.map((x) => x.descrizione),
  };
}
