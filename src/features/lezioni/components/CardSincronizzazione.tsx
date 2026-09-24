import { RefreshCw } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatRelative } from "@/shared/utils/formatDate";
import type { StatoSync } from "../types";

interface CardSincronizzazioneProps {
  stato: StatoSync | null | undefined;
  caricamento: boolean;
  totaleCatalogo: number;
  inCorso: boolean;
  onSincronizza: () => void;
}

function badgeEsito(esito: string | null): { variant: "default" | "secondary" | "destructive" | "outline"; testo: string } {
  if (esito === "ok") return { variant: "secondary", testo: "Riuscita" };
  if (esito === "cookie_scaduto") return { variant: "destructive", testo: "Accesso Skool scaduto" };
  if (esito === "errore") return { variant: "destructive", testo: "Errore" };
  if (!esito) return { variant: "outline", testo: "Mai lanciata" };
  return { variant: "outline", testo: esito };
}

/** Stato dell'ultima sync Skool + pulsante "Sincronizza ora". */
export function CardSincronizzazione({ stato, caricamento, totaleCatalogo, inCorso, onSincronizza }: CardSincronizzazioneProps) {
  const esito = badgeEsito(stato?.esito ?? null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sincronizzazione</CardTitle>
        <CardDescription>
          Le lezioni della community Skool: Aura le collega ai compiti che scrive negli hub dei clienti.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {caricamento ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Ultima sync</dt>
              <dd className="font-medium">{stato?.synced_at ? formatRelative(stato.synced_at) : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Esito</dt>
              <dd>
                <Badge variant={esito.variant}>{esito.testo}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Lezioni in catalogo</dt>
              <dd className="font-medium tabular-nums">{totaleCatalogo}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Nuove all'ultima sync</dt>
              <dd className="font-medium tabular-nums">{stato?.nuove ?? 0}</dd>
            </div>
          </dl>
        )}

        {stato?.esito === "cookie_scaduto" ? (
          <p className="text-sm text-destructive">
            L&apos;accesso a Skool è scaduto: rinnova il segreto SKOOL_COOKIES nel progetto Supabase e premi
            «Sincronizza ora». Le lezioni già in memoria restano valide.
          </p>
        ) : null}
        {stato?.esito === "errore" && stato.dettaglio ? (
          <p className="text-sm text-muted-foreground">
            L&apos;ultimo controllo non è riuscito, ma le lezioni in memoria restano usabili.{" "}
            <span className="break-words">({stato.dettaglio.slice(0, 160)})</span>
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" disabled={inCorso} onClick={onSincronizza}>
            <RefreshCw className={inCorso ? "animate-spin" : ""} aria-hidden />
            {inCorso ? "Sto leggendo la classroom…" : "Sincronizza ora"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {inCorso ? "Può richiedere fino a 2 minuti." : "Si aggiorna da sola una volta al mese."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
