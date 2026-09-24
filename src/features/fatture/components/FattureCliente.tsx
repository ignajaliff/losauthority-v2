import { useState } from "react";
import { Plus } from "lucide-react";
import { esFinance, useAuth } from "@/features/auth";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ErroreCaricamento, SkeletonRighe, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { formatCurrency, sumImporti } from "@/shared/utils/formatCurrency";
import { useFattureCliente } from "../hooks/useFattureCliente";
import type { Fattura } from "../types";
import { FatturaForm } from "./FatturaForm";
import { FattureTabella } from "./FattureTabella";

interface FattureClienteProps {
  clienteId: string;
  /** Nasconde form e azioni (area cliente). */
  soloLettura?: boolean;
}

function Totale({ etichetta, valore }: { etichetta: string; valore: number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{etichetta}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(valore)}</div>
    </div>
  );
}

function Totali({ fatture }: { fatture: Fattura[] }) {
  const totale = sumImporti(fatture.map((f) => f.importo));
  const incassato = sumImporti(fatture.filter((f) => f.pagata).map((f) => f.importo));
  const daIncassare = sumImporti(fatture.filter((f) => !f.pagata).map((f) => f.importo));
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Totale etichetta="Totale fatturato" valore={totale} />
      <Totale etichetta="Incassato" valore={incassato} />
      <Totale etichetta="Da incassare" valore={daIncassare} />
    </div>
  );
}

/**
 * Fatture di un cliente: totali, tabella, azioni e form "Aggiungi fattura".
 * Riusabile nella scheda cliente (team) e nell'area cliente (soloLettura).
 */
export function FattureCliente({ clienteId, soloLettura = false }: FattureClienteProps) {
  const { utente } = useAuth();
  const puoModificare = !soloLettura && esFinance(utente?.rol ?? null);
  const { data: fatture, isLoading, isError } = useFattureCliente(clienteId);
  const [formAperto, setFormAperto] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Fatture</CardTitle>
            <CardDescription>
              {puoModificare ? "Segna i pagamenti e allega il PDF di ogni fattura." : "Le fatture del percorso e il loro stato."}
            </CardDescription>
          </div>
          {puoModificare ? (
            <Button onClick={() => setFormAperto(true)}>
              <Plus /> Aggiungi fattura
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading ? <SkeletonRighe righe={4} /> : null}
        {isError ? <ErroreCaricamento /> : null}
        {fatture ? (
          fatture.length === 0 ? (
            <StatoVuoto
              titolo="Ancora nessuna fattura"
              testo={puoModificare ? "Aggiungi la prima con il pulsante qui sopra." : undefined}
            />
          ) : (
            <>
              <Totali fatture={fatture} />
              <FattureTabella fatture={fatture} soloLettura={!puoModificare} />
            </>
          )
        ) : null}
      </CardContent>

      {puoModificare ? <FatturaForm clienteId={clienteId} open={formAperto} onOpenChange={setFormAperto} /> : null}
    </Card>
  );
}
