import { dataBreve } from "@contratti/documento.ts";
import { indirizzoInRiga } from "@contratti/fornitore.ts";
import type { DatiCliente, DatiProfessionista, DatiSocieta, TipoCliente } from "@contratti/tipi.ts";

/** I dati inseriti dal cliente, come elenco etichetta → valore (scheda del contratto nel gestionale). */
export function righeDati(tipo: TipoCliente, dati: DatiCliente): [string, string][] {
  const recapito = (d: { codice_destinatario: string; pec: string }) =>
    [d.codice_destinatario && `codice ${d.codice_destinatario}`, d.pec && `PEC ${d.pec}`].filter(Boolean).join(" · ");
  const contatti = (d: DatiCliente): [string, string][] => [
    ["Email", d.email],
    ["Telefono", d.telefono],
    ...(d.instagram ? ([["Instagram", d.instagram]] as [string, string][]) : []),
    ...(d.tiktok ? ([["TikTok", d.tiktok]] as [string, string][]) : []),
  ];

  if (tipo === "societa") {
    const s = dati as DatiSocieta;
    return [
      ["Ragione sociale", s.ragione_sociale],
      ["Partita IVA", s.partita_iva],
      ["Codice fiscale", s.codice_fiscale],
      ["Sede legale", indirizzoInRiga(s.indirizzo)],
      ["Fattura elettronica", recapito(s)],
      ["Legale rappresentante", `${s.rappresentante_nome} ${s.rappresentante_cognome}`],
      ["Segue il programma", `${s.partecipante_nome} ${s.partecipante_cognome}`],
      ...contatti(s),
    ];
  }
  const p = dati as DatiProfessionista;
  return [
    ["Nome e cognome", `${p.nome} ${p.cognome}`],
    ["Nascita", `${p.luogo_nascita}, ${dataBreve(p.data_nascita)}`],
    ["Codice fiscale", p.codice_fiscale],
    ...(tipo === "professionista"
      ? ([
          ["Partita IVA", p.partita_iva],
          ["Sede", indirizzoInRiga(p.indirizzo)],
          ["Fattura elettronica", recapito(p)],
        ] as [string, string][])
      : ([["Residenza", indirizzoInRiga(p.indirizzo)]] as [string, string][])),
    ...contatti(p),
  ];
}
