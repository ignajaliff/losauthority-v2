import type { Tables } from "@/integrations/supabase/types";

export type KitBrandRiga = Tables<"kit_brand">;
export type ColoreBrand = Tables<"kit_brand_colori">;
export type FontBrand = Tables<"kit_brand_font">;
export type DocumentoBrand = Tables<"kit_brand_documenti">;

/** Tutto il kit del cliente in una lettura: la riga (null finché non scrive nulla) e le liste in ordine. */
export interface KitBrand {
  kit: KitBrandRiga | null;
  colori: ColoreBrand[];
  font: FontBrand[];
  documenti: DocumentoBrand[];
}

/** Campi di testo della riga `kit_brand` che il cliente scrive in pagina. */
export type CampoKit = "nome_brand" | "payoff" | "tono_voce" | "note";

export const MAX_COLORI = 12;
export const MAX_FONT = 6;
export const MAX_DOCUMENTI = 20;
export const BUCKET_KIT = "kit-brand";
export const MAX_BYTE_FILE = 15 * 1024 * 1024;

export type RuoloColore = "primario" | "secondario" | "accento" | "sfondo" | "testo" | "altro";
export const RUOLI_COLORE: Array<{ valore: RuoloColore; etichetta: string }> = [
  { valore: "primario", etichetta: "Primario" },
  { valore: "secondario", etichetta: "Secondario" },
  { valore: "accento", etichetta: "Accento" },
  { valore: "sfondo", etichetta: "Sfondo" },
  { valore: "testo", etichetta: "Testo" },
  { valore: "altro", etichetta: "Altro" },
];

export type RuoloFont = "titoli" | "testo" | "accento";
export const RUOLI_FONT: Array<{ valore: RuoloFont; etichetta: string; specimen: string }> = [
  { valore: "titoli", etichetta: "Titoli", specimen: "Il nome del brand e i titoli grandi." },
  { valore: "testo", etichetta: "Testo", specimen: "I paragrafi, le didascalie, tutto quello che si legge con calma." },
  { valore: "accento", etichetta: "Accento", specimen: "Una parola che deve farsi notare." },
];

/** «#AbC123» → «#abc123»; «abc123» → «#abc123»; null se non è un colore. */
export function normalizzaHex(raw: string): string | null {
  const v = raw.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(v)) return `#${v.split("").map((c) => c + c).join("")}`;
  return /^[0-9a-f]{6}$/.test(v) ? `#${v}` : null;
}

/** Testo nero o bianco a seconda della luminanza del colore (per scrivere l'hex sopra la banda). */
export function testoSu(hex: string): "#0c0e12" | "#ffffff" {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.6 ? "#0c0e12" : "#ffffff";
}

const MIME_LOGO = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const EXT_FONT: Record<string, string> = { ttf: "font/ttf", otf: "font/otf", woff: "font/woff", woff2: "font/woff2" };
const MIME_DOCUMENTO = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export function estensione(nome: string): string {
  const punto = nome.lastIndexOf(".");
  const ext = punto >= 0 ? nome.slice(punto + 1).toLowerCase() : "";
  return /^[a-z0-9]{1,8}$/.test(ext) ? ext : "bin";
}

/** Il MIME con cui caricare un file font: il browser spesso non lo sa (octet-stream), lo deduciamo dall'estensione. */
export function mimeFont(file: File): string | null {
  return EXT_FONT[estensione(file.name)] ?? null;
}

/** Motivo per cui un file non va bene per quel posto del kit, o null se va bene. */
export function motivoFileNonValido(file: File, uso: "logo" | "font" | "documento"): string | null {
  if (file.size > MAX_BYTE_FILE) return `"${file.name}" supera i 15 MB.`;
  if (uso === "logo" && !MIME_LOGO.includes(file.type)) return `"${file.name}": per il logo servono PNG, JPG, WebP o SVG.`;
  if (uso === "font" && !mimeFont(file)) return `"${file.name}": per il font servono file .ttf, .otf, .woff o .woff2.`;
  if (uso === "documento" && !MIME_DOCUMENTO.includes(file.type)) return `"${file.name}": sono ammessi PDF, immagini, testo, Word e PowerPoint.`;
  return null;
}

/** «1,2 MB» per l'indice dei documenti. */
export function formatPeso(byte: number): string {
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`;
  return `${(byte / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Aura legge PDF e immagini; il resto lo vede solo come nome + descrizione. */
export function auraLegge(nome: string): boolean {
  return ["pdf", "png", "jpg", "jpeg", "webp"].includes(estensione(nome));
}
