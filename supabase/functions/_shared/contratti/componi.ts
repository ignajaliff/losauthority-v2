/**
 * Mette insieme il contratto di UN cliente: sceglie il testo giusto (privati o
 * partita IVA) e ci scrive dentro i suoi dati. Niente allegati: l'informativa
 * privacy sta su una pagina a sé, richiamata nel testo.
 * Funzione pura: stessi dati, stesso identico testo.
 */

import { FORNITORE } from "./fornitore.ts";
import { VERSIONE_INFORMATIVA } from "./informativa.ts";
import { APPROVAZIONE_PIVA, MODELLO_PIVA, corpoPiva } from "./testo-piva.ts";
import {
  APPROVAZIONE_PRIVATO,
  MODELLO_PRIVATO,
  corpoPrivato,
} from "./testo-privato.ts";
import type {
  DatiCliente,
  DatiPrivato,
  DatiProfessionista,
  DatiSocieta,
  DocumentoContratto,
  TipoCliente,
} from "./tipi.ts";

export interface CondizioniContratto {
  prezzo: number;
  /** Telefono del Fornitore: se c'è, compare tra le parti. */
  telefonoFornitore?: string | null;
}

export function componiContratto(
  tipo: TipoCliente,
  dati: DatiCliente,
  condizioni: CondizioniContratto,
): DocumentoContratto {
  const firmatario_fornitore = `Il Fornitore – ${FORNITORE.nome}`;

  if (tipo === "privato") {
    const d = dati as DatiPrivato;
    return {
      modello: MODELLO_PRIVATO,
      corpo: corpoPrivato(d, condizioni.prezzo, condizioni.telefonoFornitore),
      approvazione: APPROVAZIONE_PRIVATO,
      allegati: [],
      informativa_versione: VERSIONE_INFORMATIVA,
      firmatario_fornitore,
      firmatario_cliente: `Il Cliente – ${d.nome} ${d.cognome}`,
    };
  }

  if (tipo === "professionista") {
    const d = dati as DatiProfessionista;
    return {
      modello: MODELLO_PIVA,
      corpo: corpoPiva("professionista", d, condizioni.prezzo, condizioni.telefonoFornitore),
      approvazione: APPROVAZIONE_PIVA,
      allegati: [],
      informativa_versione: VERSIONE_INFORMATIVA,
      firmatario_fornitore,
      firmatario_cliente: `Il Cliente – ${d.nome} ${d.cognome}`,
    };
  }

  const d = dati as DatiSocieta;
  return {
    modello: MODELLO_PIVA,
    corpo: corpoPiva("societa", d, condizioni.prezzo, condizioni.telefonoFornitore),
    approvazione: APPROVAZIONE_PIVA,
    allegati: [],
    informativa_versione: VERSIONE_INFORMATIVA,
    firmatario_fornitore,
    firmatario_cliente:
      `Il Cliente – ${d.ragione_sociale}, in persona del legale rappresentante ` +
      `${d.rappresentante_nome} ${d.rappresentante_cognome}`,
  };
}
