/**
 * Il Kit Brand del cliente (Cervello → Kit Brand) reso in testo per i prompt
 * di Aura: nome, payoff, tono di voce, colori con hex, font, documenti con il
 * testo estratto. Entra nel tratto «cliente» di `blocchiPrompt` di tutti gli
 * agenti del cliente: così qualunque domanda sulla marca (colori, font, tono,
 * cosa dice il brand book) la risolvono con i dati veri, senza inventare.
 * null = il cliente non ha ancora compilato nulla (il blocco non si aggiunge).
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const MAX_TESTO_DOCUMENTO = 8000;
const MAX_TESTO_TOTALE = 24000;

interface RigaKit {
  nome_brand: string | null;
  payoff: string | null;
  tono_voce: string | null;
  note: string | null;
  logo_path: string | null;
  logo_scuro_path: string | null;
}
interface Colore {
  hex: string;
  nome: string | null;
  ruolo: string;
}
interface Font {
  nome: string;
  ruolo: string;
  storage_path: string | null;
}
interface Documento {
  nome: string;
  descrizione: string | null;
  testo_estratto: string | null;
  estrazione_stato: string;
}

export interface KitBrand {
  kit: RigaKit | null;
  colori: Colore[];
  font: Font[];
  documenti: Documento[];
}

const RUOLO_COLORE: Record<string, string> = { primario: "primario", secondario: "secondario", accento: "accento", sfondo: "sfondo", testo: "testo", altro: "" };
const RUOLO_FONT: Record<string, string> = { titoli: "per i titoli", testo: "per i testi", accento: "d'accento" };

/** Legge kit, colori, font e documenti del cliente. Gli errori non bloccano: un pezzo mancante resta vuoto. */
export async function leggiKitBrand(admin: SupabaseClient, clienteId: string): Promise<KitBrand> {
  const [kit, colori, font, documenti] = await Promise.all([
    admin.from("kit_brand").select("nome_brand, payoff, tono_voce, note, logo_path, logo_scuro_path").eq("id", clienteId).maybeSingle(),
    admin.from("kit_brand_colori").select("hex, nome, ruolo").eq("cliente_id", clienteId).order("ordine").order("created_at"),
    admin.from("kit_brand_font").select("nome, ruolo, storage_path").eq("cliente_id", clienteId).order("ordine").order("created_at"),
    admin.from("kit_brand_documenti").select("nome, descrizione, testo_estratto, estrazione_stato").eq("cliente_id", clienteId).order("created_at"),
  ]);
  return {
    kit: (kit.data as RigaKit | null) ?? null,
    colori: (colori.data ?? []) as Colore[],
    font: (font.data ?? []) as Font[],
    documenti: (documenti.data ?? []) as Documento[],
  };
}

const taglia = (t: string, n: number) => (t.length > n ? `${t.slice(0, n)}…` : t);

/** Il blocco `=== KIT BRAND ===` per il prompt, o null se il kit è vuoto. */
export function renderKitBrand(k: KitBrand): string | null {
  const righe: string[] = [];
  const kit = k.kit;
  if (kit?.nome_brand) righe.push(`Nome del brand: ${kit.nome_brand}`);
  if (kit?.payoff) righe.push(`Payoff: ${kit.payoff}`);
  if (kit?.logo_path || kit?.logo_scuro_path) {
    righe.push(`Logo: caricato${kit.logo_scuro_path ? " (versione chiara e versione per sfondo scuro)" : ""}; non lo vedi, chiedi al cliente se serve descriverlo.`);
  }
  if (k.colori.length > 0) {
    const voci = k.colori.map((c) => {
      const ruolo = RUOLO_COLORE[c.ruolo] ?? "";
      const etichetta = [c.nome, ruolo].filter(Boolean).join(", ");
      return `${c.hex}${etichetta ? ` (${etichetta})` : ""}`;
    });
    righe.push(`Colori: ${voci.join(" · ")}`);
  }
  if (k.font.length > 0) {
    righe.push(`Font: ${k.font.map((f) => `${f.nome} ${RUOLO_FONT[f.ruolo] ?? ""}`.trim()).join(" · ")}`);
  }
  if (kit?.tono_voce) righe.push(`Tono di voce:\n${taglia(kit.tono_voce, 4000)}`);
  if (kit?.note) righe.push(`Note del cliente sul brand:\n${taglia(kit.note, 4000)}`);
  if (k.documenti.length > 0) {
    let spazio = MAX_TESTO_TOTALE;
    const voci = k.documenti.map((d) => {
      const testa = `### ${d.nome}${d.descrizione ? ` — ${d.descrizione}` : ""}`;
      if (d.estrazione_stato === "fatta" && d.testo_estratto && spazio > 0) {
        const t = taglia(d.testo_estratto, Math.min(MAX_TESTO_DOCUMENTO, spazio));
        spazio -= t.length;
        return `${testa}\n${t}`;
      }
      const nota = d.estrazione_stato === "non_leggibile" ? "(file non leggibile come testo: hai solo nome e descrizione)" : d.estrazione_stato === "fatta" ? "" : "(testo non ancora letto)";
      return `${testa}\n${nota}`.trim();
    });
    righe.push(`Documenti del brand:\n${voci.join("\n\n")}`);
  }
  if (righe.length === 0) return null;
  return `=== KIT BRAND DEL CLIENTE (dati veri: colori, font e tono sono questi, non inventarne altri) ===\n${righe.join("\n")}`;
}

/** Comodo per gli agenti: legge e rende in un colpo; null se vuoto o se la lettura fallisce. */
export async function bloccoKitBrand(admin: SupabaseClient, clienteId: string): Promise<string | null> {
  try {
    return renderKitBrand(await leggiKitBrand(admin, clienteId));
  } catch {
    return null;
  }
}
