import type { Domanda, Questionario, QuestionarioId } from "./types";
import { ONBOARDING_SEZIONI } from "./definizioni/onboarding";
import { AVATAR_SEZIONI } from "./definizioni/avatar";
import { OFFERTA_SEZIONI } from "./definizioni/offerta";

/**
 * Registro delle 3 schede del cliente. L'`id` è il discriminante in
 * questionario_invii.questionario_id; lo `slug` è la rotta sotto /area.
 */
export const QUESTIONARI: Questionario[] = [
  {
    id: "onboarding",
    num: 1,
    slug: "onboarding",
    titolo: "Onboarding",
    occhiello: "Scheda 1 di 3",
    sottotitolo: "Fotografiamo il tuo business e capiamo dove si blocca il funnel oggi — la diagnosi.",
    icona: "📋",
    definizione: ONBOARDING_SEZIONI,
  },
  {
    id: "avatar_dolori",
    num: 2,
    slug: "avatar",
    titolo: "Avatar & Dolori",
    occhiello: "Scheda 2 di 3",
    sottotitolo: "Chi servi davvero e cosa fa male ai tuoi clienti — la bussola della comunicazione.",
    icona: "🎯",
    definizione: AVATAR_SEZIONI,
  },
  {
    id: "offerta",
    num: 3,
    slug: "offerta",
    titolo: "Offerta",
    occhiello: "Scheda 3 di 3",
    sottotitolo: "Cosa offri e come lo impacchetti: promessa, meccanismo, scala di valore.",
    icona: "💎",
    definizione: OFFERTA_SEZIONI,
  },
];

export function getQuestionarioBySlug(slug: string): Questionario | undefined {
  return QUESTIONARI.find((q) => q.slug === slug);
}

export function getQuestionarioById(id: string): Questionario | undefined {
  return QUESTIONARI.find((q) => q.id === id);
}

/** Tutte le domande di una scheda, in ordine. */
export function domandeDi(questionario: Questionario): Domanda[] {
  return questionario.definizione.flatMap((s) => s.domande);
}

export function eQuestionarioId(valore: string): valore is QuestionarioId {
  return QUESTIONARI.some((q) => q.id === valore);
}
