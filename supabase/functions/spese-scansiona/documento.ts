/** Download dal bucket `ricevute` + conversione in blocco Anthropic (image o document). */
import { adminClient } from "../_shared/supabase.ts";

export type MediaImmagine = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export type BloccoAllegato =
  | { type: "image"; source: { type: "base64"; media_type: MediaImmagine; data: string } }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

/** ArrayBuffer → base64 a blocchi (btoa su stringhe grandi è lento/limitato). */
export function base64Da(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const passo = 0x8000;
  for (let i = 0; i < bytes.length; i += passo) {
    bin += String.fromCharCode(...bytes.subarray(i, i + passo));
  }
  return btoa(bin);
}

/** Media type dall'estensione del path; null se Claude non lo legge (es. HEIC). */
export function mediaTypeDaPath(path: string): MediaImmagine | "application/pdf" | null {
  const ext = path.toLowerCase().split(".").pop() ?? "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "pdf":
      return "application/pdf";
    default:
      return null;
  }
}

/** Path valido: relativo, senza `..`, con un'estensione. */
export function pathValido(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= 300 && !v.includes("..") && !v.startsWith("/");
}

/** Scarica il file dal bucket e lo prepara come blocco per Claude. null se non leggibile. */
export async function scaricaComeBlocco(bucket: string, path: string): Promise<BloccoAllegato | null> {
  const media = mediaTypeDaPath(path);
  if (!media) return null;
  const { data, error } = await adminClient().storage.from(bucket).download(path);
  if (error || !data) return null;
  const base64 = base64Da(await data.arrayBuffer());
  if (media === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: media, data: base64 } };
  }
  return { type: "image", source: { type: "base64", media_type: media, data: base64 } };
}
