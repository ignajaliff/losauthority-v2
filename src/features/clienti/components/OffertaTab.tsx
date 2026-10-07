import { useState } from "react";
import { CartaOfferta, codiceOfferta, DiagnosiOfferta, linkPdfOfferta, useDiagnosiOfferta, useOfferte } from "@/features/offerta";
import { Badge } from "@/shared/components/ui/badge";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { formatDate } from "@/shared/utils/formatDate";
import { cn } from "@/lib/utils";
import type { ClienteDettaglio } from "../types";

/**
 * Tab "Offerta" della scheda cliente: le offerte che il cliente ha costruito
 * con Aura. Il team vede la carta con tutta la struttura (e può scaricare il
 * PDF) e, in più, la DIAGNOSI per Wesley (tabella offerta_diagnosi, che il
 * cliente non legge).
 */
export function OffertaTab({ cliente }: { cliente: ClienteDettaglio }) {
  const { data, isLoading, isError } = useOfferte(cliente.id);
  const [sceltaId, setSceltaId] = useState<string | null>(null);
  const offerte = data ?? [];
  const scelta = offerte.find((o) => o.id === sceltaId) ?? offerte.find((o) => o.stato === "completo") ?? offerte[0] ?? null;
  const numero = scelta ? offerte.findIndex((o) => o.id === scelta.id) + 1 : 1;
  const diagnosi = useDiagnosiOfferta(scelta?.id);

  if (isLoading) return <SkeletonBlocco altezza="h-64" />;
  if (isError) return <ErroreCaricamento />;
  if (offerte.length === 0) {
    return <StatoVuoto titolo="Nessuna offerta ancora" testo="Il cliente la costruisce dalla sua area: Cervello del tuo branding → Offerta, in conversazione con Aura." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
      <nav aria-label="Offerte del cliente" className="grid gap-2">
        {offerte.map((o, i) => {
          const attiva = scelta?.id === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setSceltaId(o.id)}
              aria-current={attiva ? "true" : undefined}
              className={cn(
                "grid gap-1 rounded-lg border p-3 text-left transition-colors",
                attiva ? "border-foreground/40 bg-card shadow-xs" : "border-border bg-card/60 hover:bg-card",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="figure text-[10px] tracking-[0.12em] text-muted-foreground">{codiceOfferta(i + 1)}</span>
                <Badge variant={o.stato === "completo" ? "active" : "neutral"} dot>
                  {o.stato === "completo" ? "Completa" : "In costruzione"}
                </Badge>
              </span>
              <span className="line-clamp-2 font-display text-[19px] leading-tight font-medium">{o.nome ?? "Senza nome"}</span>
              <span className="truncate text-xs text-muted-foreground">{[o.prezzo, o.per_chi].filter(Boolean).join(" · ") || `Creata il ${formatDate(o.created_at)}`}</span>
            </button>
          );
        })}
      </nav>

      {scelta ? (
        <div className="grid min-w-0 gap-5">
          <CartaOfferta offerta={scelta} numero={numero} titolare={cliente.utente.nombre} inCompilazione={scelta.stato !== "completo"} linkPdf={linkPdfOfferta(scelta.id)} larga />
          {diagnosi.isError ? <ErroreCaricamento /> : <DiagnosiOfferta diagnosi={diagnosi.data ?? null} completa={scelta.stato === "completo"} />}
        </div>
      ) : null}
    </div>
  );
}
