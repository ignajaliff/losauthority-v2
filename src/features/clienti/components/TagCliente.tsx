import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ErroreCaricamento, SkeletonRighe } from "@/shared/components/layout/StatoCaricamento";
import { useAggiornaTagCliente } from "../hooks/useAggiornaCliente";
import { useCreaTag, useTags } from "../hooks/useTags";
import type { ClienteDettaglio } from "../types";
import { TagPicker } from "./TagPicker";

/** Tag del cliente: aggiungi/rimuovi righe in `clienti_tags`, con creazione al volo. */
export function TagCliente({ cliente }: { cliente: ClienteDettaglio }) {
  const { data: tags, isLoading, isError } = useTags();
  const creaTag = useCreaTag();
  const aggiorna = useAggiornaTagCliente(cliente.id);
  const attuali = cliente.tags.map((t) => t.id);
  const [scelti, setScelti] = useState<string[]>(attuali);
  const [nuovoTag, setNuovoTag] = useState("");
  const occupato = creaTag.isPending || aggiorna.isPending;

  async function salva() {
    let finali = scelti;
    if (nuovoTag.trim()) {
      const creato = await creaTag.mutateAsync(nuovoTag).catch(() => null);
      if (!creato) return;
      finali = [...new Set([...scelti, creato.id])];
      setScelti(finali);
      setNuovoTag("");
    }
    aggiorna.mutate({ attuali, scelti: finali });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tag</CardTitle>
        <CardDescription>Servizi venduti ed etichette del cliente.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading ? <SkeletonRighe righe={2} /> : null}
        {isError ? <ErroreCaricamento /> : null}
        {tags ? (
          <TagPicker tags={tags} selezionati={scelti} onChange={setScelti} nuovoTag={nuovoTag} onNuovoTagChange={setNuovoTag} disabled={occupato} />
        ) : null}
        <div>
          <Button size="sm" onClick={() => void salva()} disabled={occupato || !tags}>
            {occupato ? "Salvo…" : "Salva tag"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
