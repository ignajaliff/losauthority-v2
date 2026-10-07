export { CardOffertaMini } from "./components/CardOffertaMini";
export { CartaOfferta } from "./components/CartaOfferta";
export { DiagnosiOfferta } from "./components/DiagnosiOfferta";
export { OffertaVuota } from "./components/OffertaVuota";
export { StrutturaOfferta } from "./components/StrutturaOfferta";
export { chiaviOfferta, useCreaOfferta, useDiagnosiOfferta, useEliminaOfferta, useInviaOfferta, useMessaggiOfferta, useOfferta, useOfferte } from "./hooks/useOfferta";
export { campiCompilati, codiceOfferta, ETICHETTA_POSIZIONAMENTO, FASI_OFFERTA, haStruttura, sezioniOfferta } from "./types";
export type { DiagnosiOfferta as DiagnosiOffertaRiga, MessaggioOfferta, Offerta } from "./types";

/** Vista di stampa (fuori dalle shell): si apre in una scheda nuova e propone "Salva come PDF". */
export const linkPdfOfferta = (id: string) => `/stampa/offerta/${id}`;
