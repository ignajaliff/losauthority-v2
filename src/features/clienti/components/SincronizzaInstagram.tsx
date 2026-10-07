import { Instagram, RefreshCw } from "lucide-react";
import { handleDaUrl, useAggiornaInstagram } from "@/features/pubblicazioni";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDateTime } from "@/shared/utils/formatDate";
import type { ClienteDettaglio } from "../types";

/** Stato della sincronizzazione Instagram del cliente e «Aggiorna adesso» (profilo + numeri). */
export function SincronizzaInstagram({ cliente }: { cliente: ClienteDettaglio }) {
  const aggiorna = useAggiornaInstagram(cliente.id);
  const handle = handleDaUrl(cliente.instagram);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2 text-base">
          <Instagram className="size-4" aria-hidden /> Pubblicazioni da Instagram
        </CardTitle>
        <CardDescription>
          Gli ultimi video del profilo diventano carte in Pubblicazioni; i numeri si rileggono ogni 15 giorni, i video nuovi ogni 30. Il link lo
          cambi nei dati del cliente.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <dl className="grid gap-1">
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted-foreground">Profilo</dt>
            <dd>
              {cliente.instagram ? (
                <a href={cliente.instagram} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  @{handle ?? cliente.instagram}
                </a>
              ) : (
                "Non indicato"
              )}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted-foreground">Ultima lettura</dt>
            <dd>{cliente.instagram_sync_il ? formatDateTime(cliente.instagram_sync_il) : "Mai"}</dd>
          </div>
          {cliente.instagram_sync_errore ? (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Ultimo errore</dt>
              <dd className="text-destructive">{cliente.instagram_sync_errore}</dd>
            </div>
          ) : null}
        </dl>
        <Button size="sm" variant="outline" className="w-fit" disabled={!cliente.instagram || aggiorna.isPending} onClick={() => aggiorna.mutate()}>
          <RefreshCw className={aggiorna.isPending ? "animate-spin" : undefined} aria-hidden />
          {aggiorna.isPending ? "Leggo Instagram…" : "Aggiorna adesso"}
        </Button>
      </CardContent>
    </Card>
  );
}
