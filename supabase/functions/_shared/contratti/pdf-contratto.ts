/**
 * Impagina il contratto firmato: testo, firme, allegati e, in fondo, il
 * registro con le prove della firma. Parte SOLO da ciò che è salvato nella
 * riga del contratto, così il PDF si può rigenerare identico in ogni momento.
 */

import { dataEstesa, istanteInItalia, oggiInItalia, tratti } from "./documento.ts";
import { FORNITORE } from "./fornitore.ts";
import { Pdf, larghezza, type Tratto } from "./pdf.ts";
import type { Blocco, DocumentoContratto, Firma, TipoCliente } from "./tipi.ts";

/** Come il cliente ha dichiarato di acquistare, scritto nel registro della firma. */
const ACQUISTO: Record<TipoCliente, string> = {
  privato: "come privato (consumatore), senza partita IVA",
  professionista: "con partita IVA, nell'esercizio della propria attività",
  societa: "come società, con la firma del legale rappresentante",
};

export interface DatiPdfContratto {
  id: string;
  documento: DocumentoContratto;
  tipo: TipoCliente;
  clienteNome: string;
  /** Quando Wesley ha creato l'invito (la sua proposta). */
  creatoIl: string;
  informativaLettaIl: string | null;
  compilatoIl: string | null;
  firmatoIl: string;
  firmaContratto: Firma;
  firmaClausole: Firma;
  firmaFornitore: Firma | null;
  ip: string | null;
  userAgent: string | null;
  testoSha256: string;
}

function inTratti(testo: string): Tratto[] {
  return tratti(testo).map((t) => ({ testo: t.testo, stile: t.grassetto ? "grassetto" : "normale" }));
}

function scrivi(pdf: Pdf, lista: Blocco[], allegati = false): void {
  for (const b of lista) {
    switch (b.t) {
      case "pagina":
        pdf.nuovaPagina();
        break;
      case "titolo":
        pdf.paragrafo([{ testo: b.testo, stile: "grassetto" }], {
          corpo: 20,
          allinea: "sinistra",
          spazioDopo: 8,
        });
        pdf.filetto();
        pdf.spazio(6);
        break;
      case "sezione":
        // Ogni allegato comincia su una pagina sua: si può stampare da solo.
        if (allegati) pdf.nuovaPagina();
        else {
          pdf.spazio(12);
          pdf.riserva(70);
        }
        pdf.paragrafo([{ testo: b.testo, stile: "grassetto" }], {
          corpo: 13.5,
          allinea: "sinistra",
          spazioDopo: 6,
        });
        break;
      case "articolo":
        pdf.spazio(10);
        // Il titolo di un articolo non resta mai solo in fondo alla pagina.
        pdf.riserva(64);
        pdf.paragrafo([{ testo: b.testo, stile: "grassetto" }], {
          corpo: 11.5,
          allinea: "sinistra",
          spazioDopo: 4,
        });
        break;
      case "centro":
        pdf.spazio(4);
        pdf.paragrafo([{ testo: b.testo, stile: "grassetto" }], { allinea: "centro", spazioDopo: 6 });
        break;
      case "voce": {
        const punto = "•  ";
        pdf.paragrafo([{ testo: punto }, ...inTratti(b.testo)], {
          rientro: 4,
          sporgenza: larghezza(punto, "normale", 10.5),
          spazioDopo: 3.5,
        });
        break;
      }
      case "nota":
        pdf.paragrafo([{ testo: b.testo, stile: "corsivo" }], {
          corpo: 9,
          allinea: "sinistra",
          grigio: 0.3,
          spazioDopo: 7,
        });
        break;
      case "p":
        pdf.paragrafo(inTratti(b.testo), { spazioDopo: 5 });
        break;
    }
  }
}

function riga(pdf: Pdf, etichetta: string, valore: string): void {
  pdf.paragrafo(
    [{ testo: `${etichetta}: `, stile: "grassetto" }, { testo: valore }],
    { corpo: 9, allinea: "sinistra", spazioDopo: 2 },
  );
}

export function pdfContratto(d: DatiPdfContratto): Uint8Array {
  const doc = d.documento;
  const pdf = new Pdf({
    titolo: `Contratto Programma UPSCALE – ${d.clienteNome}`,
    autore: FORNITORE.nome,
    data: new Date(d.firmatoIl),
    piede: `Contratto Programma UPSCALE · ${d.clienteNome}`,
    id: d.id,
  });

  scrivi(pdf, doc.corpo);

  /* ----- Firme ----- */
  const giornoFirma = dataEstesa(oggiInItalia(new Date(d.firmatoIl)));
  const firmatoIl = `Firmato il ${istanteInItalia(d.firmatoIl)} (ora italiana)`;
  pdf.spazio(12);
  pdf.riserva(230);
  pdf.paragrafo([{ testo: "Firme", stile: "grassetto" }], { corpo: 13.5, allinea: "sinistra", spazioDopo: 6 });
  pdf.paragrafo([{ testo: `Luogo e data: ${FORNITORE.luogo}, ${giornoFirma}` }], {
    allinea: "sinistra",
    spazioDopo: 10,
  });
  pdf.firma(
    doc.firmatario_fornitore,
    d.firmaFornitore,
    d.firmaFornitore
      ? `Firma apposta dal Fornitore all'emissione della proposta, il ${dataEstesa(oggiInItalia(new Date(d.creatoIl)))}`
      : "",
  );
  pdf.firma(doc.firmatario_cliente, d.firmaContratto, firmatoIl);
  pdf.spazio(4);
  pdf.riserva(190);
  pdf.paragrafo(inTratti(doc.approvazione), { spazioDopo: 10 });
  pdf.firma("Il Cliente", d.firmaClausole, firmatoIl);

  /* ----- Allegati ----- */
  scrivi(pdf, doc.allegati, true);

  /* ----- Registro della firma: di seguito alle firme, in piccolo ----- */
  pdf.spazio(8);
  pdf.riserva(150);
  pdf.filetto();
  pdf.spazio(8);
  pdf.paragrafo([{ testo: "Registro della firma", stile: "grassetto" }], {
    corpo: 11,
    allinea: "sinistra",
    spazioDopo: 3,
  });
  pdf.paragrafo(
    [
      {
        testo:
          "Dati tecnici registrati dal sistema al momento della firma. Non fanno parte delle clausole del contratto.",
        stile: "corsivo",
      },
    ],
    { corpo: 8.5, allinea: "sinistra", grigio: 0.3, spazioDopo: 6 },
  );
  riga(pdf, "Contratto", d.id);
  riga(pdf, "Versione del testo", doc.modello);
  riga(pdf, "Acquisto dichiarato dal Cliente", ACQUISTO[d.tipo]);
  riga(pdf, "Proposta emessa dal Fornitore", `${istanteInItalia(d.creatoIl)} (ora italiana)`);
  if (d.informativaLettaIl) {
    riga(
      pdf,
      "Presa visione dell'informativa privacy",
      `${istanteInItalia(d.informativaLettaIl)} (ora italiana)` +
        (doc.informativa_versione ? `, versione ${doc.informativa_versione}` : ""),
    );
  }
  if (d.compilatoIl) {
    riga(pdf, "Dati inseriti dal Cliente", `${istanteInItalia(d.compilatoIl)} (ora italiana)`);
  }
  riga(
    pdf,
    "Contratto firmato dal Cliente",
    `${istanteInItalia(d.firmatoIl)} (ora italiana; ${new Date(d.firmatoIl).toISOString()})`,
  );
  riga(pdf, "Indirizzo IP", d.ip || "non rilevato");
  riga(pdf, "Dispositivo e browser", d.userAgent || "non rilevato");
  riga(pdf, "Impronta SHA-256 del testo firmato", d.testoSha256);
  pdf.spazio(3);
  pdf.paragrafo(
    [
      {
        testo:
          "Firme tracciate sullo schermo dal link personale del Cliente; ne è conservato solo il disegno. " +
          "L'impronta è calcolata sul testo integrale del contratto: se cambiasse un solo carattere, sarebbe diversa.",
      },
    ],
    { corpo: 8.5, grigio: 0.3, spazioDopo: 0 },
  );

  return pdf.chiudi();
}
