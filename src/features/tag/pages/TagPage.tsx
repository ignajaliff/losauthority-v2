import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonRighe, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { NuovoTagForm } from "../components/NuovoTagForm";
import { TagRiga } from "../components/TagRiga";
import { useTags } from "../hooks/useTag";

export default function TagPage() {
  const { data: tags, isLoading, isError } = useTags();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader titolo="Tag servizio" sottotitolo="Etichette riutilizzabili per i clienti" />

      <div className="grid gap-4">
        <NuovoTagForm />

        <Card>
          <CardHeader>
            <CardTitle>Tag esistenti</CardTitle>
            <CardDescription>
              Rinomina un tag e i clienti lo vedranno aggiornato; eliminarlo lo toglie a tutti.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonRighe righe={4} />
            ) : isError ? (
              <ErroreCaricamento />
            ) : !tags || tags.length === 0 ? (
              <StatoVuoto
                titolo="Ancora nessun tag"
                testo="Aggiungine uno qui sopra, oppure creane uno al volo quando crei o modifichi un cliente."
              />
            ) : (
              <ul className="divide-y">
                {tags.map((tag) => (
                  <TagRiga key={tag.id} tag={tag} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
