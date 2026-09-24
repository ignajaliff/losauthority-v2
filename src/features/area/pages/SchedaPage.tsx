import { Link, useParams } from "react-router-dom";
import { QuestionarioFlow, getQuestionarioBySlug } from "@/features/questionari";
import { Button } from "@/shared/components/ui/button";
import { StatoVuoto } from "@/shared/components/layout/StatoCaricamento";

/** /area/:slug → compilazione (o rilettura) di una delle 3 schede. */
export default function SchedaPage() {
  const { slug } = useParams<{ slug: string }>();
  const questionario = slug ? getQuestionarioBySlug(slug) : undefined;

  if (!questionario) {
    return (
      <div className="grid gap-4">
        <StatoVuoto titolo="Scheda non trovata" testo="Il link che hai seguito non corrisponde a nessuna delle tue schede." />
        <Button className="justify-self-start" render={<Link to="/area" />}>
          Torna alla tua area
        </Button>
      </div>
    );
  }

  return <QuestionarioFlow key={questionario.id} questionario={questionario} />;
}
