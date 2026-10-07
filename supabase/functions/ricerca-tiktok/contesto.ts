/**
 * Chi è il cliente, per le keyword: cosa fa e per chi (scheda onboarding), come
 * chiama i suoi clienti e cosa vende (parole del mestiere), i clienti ideali
 * (Avatar completi) e l'offerta. Testo breve: serve a stringere il tema sul
 * pubblico del cliente («vendere sui social» → video per chi vende servizi, non
 * per chi fa dropshipping), non a scrivere contenuti. Il nome dell'attività non
 * entra: le keyword non devono cercarlo.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { taglia } from "./filtro.ts";

const TIPI: Record<string, string> = {
  servizi: "servizi",
  prodotti_fisici: "prodotti fisici",
  prodotti_digitali: "prodotti digitali (corsi, ebook, abbonamenti, community)",
  mix: "un mix di servizi e prodotti",
};
const MERCATI: Record<string, string> = { privati: "a privati", aziende: "ad aziende", entrambi: "a privati e aziende" };

const testo = (v: unknown, n: number): string | null => (typeof v === "string" && v.trim() ? taglia(v.replace(/\s+/g, " ").trim(), n) : null);

interface Onboarding {
  attivita_breve: string | null;
  tipo: string | null;
  mercato: string | null;
  parole: unknown;
}
interface Avatar {
  nome: string | null;
  eta: string | null;
  situazione: string | null;
  settore: string | null;
  desiderio_pratico: string | null;
}
interface Offerta {
  nome: string | null;
  per_chi: string | null;
  trasformazione: string | null;
}

/** Il contesto del cliente in poche righe, o null se non c'è niente (le keyword partono allora dal solo tema). Non lancia mai. */
export async function contestoCliente(admin: SupabaseClient, clienteId: string): Promise<string | null> {
  const [onb, avatar, offerta] = await Promise.all([
    admin.from("data_onboarding").select("attivita_breve, tipo, mercato, parole").eq("id", clienteId).maybeSingle(),
    admin
      .from("avatar")
      .select("nome, eta, situazione, settore, desiderio_pratico")
      .eq("cliente_id", clienteId)
      .eq("stato", "completo")
      .order("completato_il", { ascending: false })
      .limit(3),
    // Prima le offerte complete ('completo' < 'in_corso'), poi la più recente.
    admin
      .from("offerta")
      .select("nome, per_chi, trasformazione")
      .eq("cliente_id", clienteId)
      .order("stato")
      .order("updated_at", { ascending: false })
      .limit(1),
  ]).catch(() => [null, null, null] as const);

  const righe: string[] = [];
  const o = (onb?.data ?? null) as Onboarding | null;
  if (o) {
    const cosa = testo(o.attivita_breve, 300);
    const tipo = o.tipo ? TIPI[o.tipo] : null;
    const mercato = o.mercato ? MERCATI[o.mercato] : null;
    const vende = tipo ? `vende ${tipo}${mercato ? ` ${mercato}` : ""}` : null;
    if (cosa) righe.push(`Cosa fa: ${cosa}${vende ? ` (${vende})` : ""}.`);
    else if (vende) righe.push(`Il cliente ${vende}.`);
    const parole = o.parole && typeof o.parole === "object" ? (o.parole as Record<string, unknown>) : null;
    const clienti = testo(parole?.clienti, 60);
    const cosaVende = testo(parole?.cosa_vende_plurale, 80) ?? testo(parole?.cosa_vende, 80);
    if (clienti || cosaVende) {
      righe.push([clienti ? `I suoi clienti li chiama «${clienti}»` : null, cosaVende ? `vende «${cosaVende}»` : null].filter(Boolean).join("; ") + ".");
    }
  }

  const avatars = ((avatar?.data ?? []) as Avatar[])
    .map((a) => {
      const nome = testo(a.nome, 40);
      const eta = testo(a.eta, 20);
      const parti = [testo(a.situazione, 160), a.settore ? `settore: ${testo(a.settore, 80)}` : null, a.desiderio_pratico ? `vuole: ${testo(a.desiderio_pratico, 200)}` : null].filter(Boolean);
      return parti.length > 0 ? `- ${nome ?? "Avatar"}${eta ? ` (${eta})` : ""}: ${parti.join("; ")}` : null;
    })
    .filter((x): x is string => x !== null);
  if (avatars.length > 0) righe.push(`Clienti ideali:\n${avatars.join("\n")}`);

  const of = ((offerta?.data ?? []) as Offerta[])[0];
  if (of) {
    const parti = [of.per_chi ? `per chi: ${testo(of.per_chi, 200)}` : null, of.trasformazione ? `trasformazione: ${testo(of.trasformazione, 300)}` : null].filter(Boolean);
    if (parti.length > 0) righe.push(`Offerta${of.nome ? ` «${testo(of.nome, 60)}»` : ""}: ${parti.join("; ")}.`);
  }

  return righe.length > 0 ? righe.join("\n") : null;
}
