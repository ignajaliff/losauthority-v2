/**
 * Fotografia compatta del gestionale per Aura su Telegram (SOLA LETTURA).
 * Clienti (fase, stato onboarding, prossima call, tag), fatture, F24, spese,
 * ultime chiamate. I volumi sono piccoli: sta in poche righe di testo.
 */
import { adminClient } from "../_shared/supabase.ts";

interface Utente {
  id: string;
  nombre: string | null;
  email: string | null;
}
interface Cliente {
  id: string;
  fase: string;
  stato_onboarding: string;
  prossima_call: string | null;
  data_inizio: string | null;
}
interface ClienteTag {
  cliente_id: string;
  tags: { label: string } | { label: string }[] | null;
}
interface Fattura {
  cliente_id: string;
  importo: number | string;
  pagata: boolean;
  prossimo_pagamento: string | null;
  descrizione: string | null;
}
interface F24 {
  descrizione: string | null;
  importo: number | string | null;
  scadenza: string | null;
  pagato: boolean;
}
interface Spesa {
  descrizione: string;
  importo: number | string;
  tipo: string;
  data: string;
  attiva: boolean;
}
interface Chiamata {
  cliente_id: string | null;
  titolo: string | null;
  registrata_il: string | null;
}

const n = (v: number | string | null | undefined): number => {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
};
const eur = (v: number): string =>
  "€" + v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const data = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");
const somma = <T>(righe: T[], f: (r: T) => number): number => righe.reduce((s, r) => s + f(r), 0);

function labelsTag(righe: ClienteTag[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const r of righe) {
    const lista = Array.isArray(r.tags) ? r.tags : r.tags ? [r.tags] : [];
    const attuali = m.get(r.cliente_id) ?? [];
    m.set(r.cliente_id, attuali.concat(lista.map((t) => t.label)));
  }
  return m;
}

export async function costruisciSnapshot(): Promise<string> {
  const admin = adminClient();
  const oggi = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date());

  const [utentiRes, clientiRes, tagRes, fattureRes, f24Res, speseRes, chiamateRes] = await Promise.all([
    admin.from("user_roles").select("id, nombre, email").eq("rol", "cliente"),
    admin.from("clienti").select("id, fase, stato_onboarding, prossima_call, data_inizio"),
    admin.from("clienti_tags").select("cliente_id, tags(label)"),
    admin.from("fatture").select("cliente_id, importo, pagata, prossimo_pagamento, descrizione"),
    admin.from("f24").select("descrizione, importo, scadenza, pagato"),
    admin.from("spese").select("descrizione, importo, tipo, data, attiva"),
    admin.from("chiamate").select("cliente_id, titolo, registrata_il").order("registrata_il", { ascending: false }).limit(10),
  ]);

  const utenti = (utentiRes.data ?? []) as Utente[];
  const clienti = new Map(((clientiRes.data ?? []) as Cliente[]).map((c) => [c.id, c]));
  const tag = labelsTag((tagRes.data ?? []) as ClienteTag[]);
  const fatture = (fattureRes.data ?? []) as Fattura[];
  const f24 = (f24Res.data ?? []) as F24[];
  const spese = (speseRes.data ?? []) as Spesa[];
  const chiamate = (chiamateRes.data ?? []) as Chiamata[];
  const nome = new Map(utenti.map((u) => [u.id, u.nombre || u.email || "?"]));

  const righeClienti = utenti.map((u) => {
    const c = clienti.get(u.id);
    const sue = fatture.filter((f) => f.cliente_id === u.id);
    const tot = somma(sue, (f) => n(f.importo));
    const pag = somma(sue.filter((f) => f.pagata), (f) => n(f.importo));
    const t = tag.get(u.id) ?? [];
    const call = c?.prossima_call ? `${data(c.prossima_call)} ${c.prossima_call.slice(11, 16)}` : "nessuna";
    return `- ${nome.get(u.id)} (${u.email ?? "—"})${t.length ? ` [${t.join("/")}]` : ""} · fase: ${c?.fase ?? "—"} · onboarding: ${c?.stato_onboarding ?? "—"} · inizio: ${data(c?.data_inizio)} · prossima call: ${call} · fatturato ${eur(tot)} (incassato ${eur(pag)})`;
  });

  const nonPagate = fatture.filter((f) => !f.pagata);
  const incassato = somma(fatture.filter((f) => f.pagata), (f) => n(f.importo));
  const daIncassare = somma(nonPagate, (f) => n(f.importo));
  const righeNonPagate = nonPagate.map((f) => {
    const scaduta = f.prossimo_pagamento && f.prossimo_pagamento < oggi;
    return `- ${nome.get(f.cliente_id) ?? "?"}: ${eur(n(f.importo))}${f.descrizione ? ` (${f.descrizione})` : ""} · scadenza ${data(f.prossimo_pagamento)}${scaduta ? " ⚠️ SCADUTA" : ""}`;
  });

  const f24DaPagare = f24.filter((x) => !x.pagato);
  const righeF24 = f24DaPagare.map((x) =>
    `- ${x.descrizione || "F24"}: ${x.importo != null ? eur(n(x.importo)) : "importo da inserire"} · scadenza ${data(x.scadenza)}${x.scadenza && x.scadenza < oggi ? " ⚠️ SCADUTO" : ""}`
  );

  const meseInizio = oggi.slice(0, 8) + "01";
  const fisse = spese.filter((s) => s.tipo === "fissa" && s.attiva);
  const variabiliMese = somma(spese.filter((s) => s.tipo === "variabile" && s.data >= meseInizio), (s) => n(s.importo));

  const righeChiamate = chiamate.map((ch) =>
    `- ${data(ch.registrata_il)} · ${ch.cliente_id ? nome.get(ch.cliente_id) ?? "?" : "non assegnata"} · ${ch.titolo ?? "(senza titolo)"}`
  );

  return [
    `DATA DI OGGI: ${oggi}`,
    ``,
    `CLIENTI (${utenti.length}):`,
    ...(righeClienti.length ? righeClienti : ["- nessun cliente"]),
    ``,
    `SOLDI:`,
    `- Incassato totale: ${eur(incassato)}`,
    `- Da incassare: ${eur(daIncassare)} (${nonPagate.length} fatture non pagate)`,
    ...(righeNonPagate.length ? ["Fatture non pagate:", ...righeNonPagate] : []),
    ``,
    `F24 da pagare (${f24DaPagare.length}):`,
    ...(righeF24.length ? righeF24 : ["- nessuno"]),
    ``,
    `SPESE:`,
    `- Fisse attive: ${eur(somma(fisse, (s) => n(s.importo)))}/mese (${fisse.length} voci)`,
    `- Variabili di questo mese: ${eur(variabiliMese)}`,
    ``,
    `ULTIME CHIAMATE (${chiamate.length}):`,
    ...(righeChiamate.length ? righeChiamate : ["- nessuna"]),
  ].join("\n");
}
