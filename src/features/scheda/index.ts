export { SCHEDA_ONBOARDING, DOMANDE_ONBOARDING, domandaPerId, type Scheda } from "./scheda";
export { SchedaFlow } from "./components/SchedaFlow";
export { RiepilogoRisposte } from "./components/RiepilogoRisposte";
export { ListaFiles } from "./components/ListaFiles";
export { useStatoScheda } from "./hooks/useScheda";
export { chiaviScheda, risposteDaRiga, statoDaRiga, ETICHETTA_STATO_SCHEDA } from "./mappa";
export { formattaValore, haRisposte, paroleDi, primoNome, conParole } from "./format";
export { comeStatoRiga } from "./types";
export type {
  Blocco,
  Domanda,
  IdDomanda,
  Parole,
  Risposte,
  ValoreRisposta,
  StatoInvio,
  StatoRiga,
  StatoScheda,
  StatoSchedaInfo,
  RigaOnboarding,
  RigaChiarimento,
  RigaLettura,
  FileOnboarding,
} from "./types";
