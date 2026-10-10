import { Download, ExternalLink, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/components/ui/card";
import { formatDateTime } from "@/shared/utils/formatDate";
import { useScaricaRiassunto } from "../hooks/useChiamate";
import type { Chiamata } from "../types";
import { TitoloChiamata } from "./TitoloChiamata";
import { RiassuntoChiamata } from "./RiassuntoChiamata";
import { AzioniChiamata } from "./AzioniChiamata";
import { StatoPianoChiamata } from "./StatoPianoChiamata";
import { EliminaChiamataDialog } from "./EliminaChiamataDialog";

/** Scheda di una call: titolo, data, registrazione, riassunto, azioni, stato del piano di Aura e comandi del team. */
export function ChiamataCard({
  chiamata,
  team,
}: {
  chiamata: Chiamata;
  /** true per admin/staff: abilita modifica titolo, spunte, Aura ed elimina. */
  team: boolean;
}) {
  const scarica = useScaricaRiassunto(chiamata.cliente_id);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <TitoloChiamata chiamata={chiamata} modificabile={team} />
            <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(chiamata.registrata_il)}</p>
          </div>
          {chiamata.share_url && (
            <a
              href={chiamata.share_url}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ExternalLink /> Apri su Fathom
            </a>
          )}
        </div>
      </CardHeader>

      <CardContent className="grid gap-4">
        {chiamata.riassunto ? (
          <RiassuntoChiamata riassunto={chiamata.riassunto} />
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">Riassunto non ancora scaricato.</p>
            {team && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={scarica.isPending || !chiamata.fathom_recording_id}
                onClick={() => scarica.mutate({ chiamataId: chiamata.id })}
              >
                {scarica.isPending ? <Loader2 className="animate-spin" /> : <Download />}
                {scarica.isPending ? "Sto scaricando e traducendo…" : "Scarica riassunto"}
              </Button>
            )}
            {scarica.isPending && (
              <span className="text-xs text-muted-foreground">può volerci fino a un minuto</span>
            )}
          </div>
        )}
        <AzioniChiamata chiamataId={chiamata.id} modificabile={team} />
      </CardContent>

      {team && (
        <CardFooter className="flex-col items-stretch gap-3 border-t pt-4">
          <StatoPianoChiamata chiamata={chiamata} />
          <div className="flex justify-end">
            <EliminaChiamataDialog chiamata={chiamata} />
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
