import { useRef } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApriDocumento, useCaricaDocumento, useEliminaDocumento } from "../hooks/useFileKit";
import { useAggiornaDocumento } from "../hooks/useKitBrand";
import { auraLegge, type DocumentoBrand, formatPeso, MAX_DOCUMENTI } from "../types";
import { TestoInLinea } from "./TestoInLinea";

interface IndiceDocumentiProps {
  clienteId: string;
  documenti: DocumentoBrand[];
}

const ACCETTA = ".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx,.pptx";

/** Lo stato della lettura di Aura, in una parola e un punto colorato. */
function StatoLettura({ doc }: { doc: DocumentoBrand }) {
  if (!auraLegge(doc.nome)) return <span className="text-muted-foreground">Aura vede nome e descrizione</span>;
  const mappa: Record<string, { testo: string; classe: string }> = {
    da_fare: { testo: "Aura lo sta per leggere", classe: "bg-status-expiring" },
    in_corso: { testo: "Aura lo sta leggendo", classe: "bg-status-expiring animate-pulse" },
    fatta: { testo: "Letto da Aura", classe: "bg-status-active" },
    non_leggibile: { testo: "Senza testo leggibile", classe: "bg-muted-foreground" },
    errore: { testo: "Lettura non riuscita, riprova più tardi", classe: "bg-status-churn" },
  };
  const s = mappa[doc.estrazione_stato] ?? mappa.da_fare;
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", s.classe)} aria-hidden /> {s.testo}
    </span>
  );
}

/**
 * I documenti del brand come l'indice di un libro: numero in monospace, nome,
 * descrizione da scrivere in linea, peso e stato della lettura di Aura. Niente card.
 */
export function IndiceDocumenti({ clienteId, documenti }: IndiceDocumentiProps) {
  const carica = useCaricaDocumento(clienteId);
  const elimina = useEliminaDocumento(clienteId);
  const apri = useApriDocumento();
  const aggiorna = useAggiornaDocumento(clienteId);
  const input = useRef<HTMLInputElement>(null);

  return (
    <section aria-labelledby="kit-documenti" className="grid gap-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="kit-documenti" className="eyebrow shrink-0 text-[10px]">
          Documenti · {documenti.length}
        </h3>
        <span className="text-[12px] text-muted-foreground">Brand book, linee guida, presentazioni: Aura legge PDF e immagini</span>
      </div>

      {documenti.length > 0 ? (
        <ol className="grid">
          {documenti.map((d, i) => (
            <li key={d.id} className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-3 border-t py-4 first:border-t-0 first:pt-0 md:grid-cols-[56px_minmax(0,1fr)_auto] md:gap-x-6">
              <span className="figure pt-0.5 text-[13px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => apri.mutate(d.storage_path)}
                  className="inline-flex max-w-full items-center gap-1.5 text-left text-[17px] leading-snug underline-offset-4 hover:underline pointer-coarse:min-h-9"
                >
                  <span className="truncate">{d.nome}</span>
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </button>
                <TestoInLinea
                  valore={d.descrizione}
                  segnaposto="Di cosa parla, in una riga: aiuta Aura a sapere quando usarlo"
                  etichetta={`Descrizione di ${d.nome}`}
                  maxLength={1000}
                  multiriga
                  className="mt-1 text-[14px] leading-relaxed text-muted-foreground"
                  onSalva={(descrizione) => aggiorna.mutate({ id: d.id, descrizione })}
                />
                <p className="mt-1.5 flex flex-wrap gap-x-3 text-[12px]">
                  <span className="figure text-muted-foreground">{formatPeso(d.dimensione)}</span>
                  <StatoLettura doc={d} />
                </p>
              </div>
              <button
                type="button"
                disabled={elimina.isPending}
                onClick={() => elimina.mutate(d)}
                aria-label={`Elimina ${d.nome}`}
                className="col-start-2 mt-2 inline-flex w-fit items-center gap-1 text-[12px] text-muted-foreground underline-offset-4 hover:text-status-churn hover:underline pointer-coarse:mt-0 pointer-coarse:min-h-9 md:col-start-3 md:mt-0.5"
              >
                <Trash2 className="size-3" aria-hidden /> Elimina
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="font-display text-2xl text-muted-foreground">Nessun documento ancora.</p>
      )}

      {documenti.length < MAX_DOCUMENTI ? (
        <div className="border-t border-dashed pt-5">
          <button
            type="button"
            disabled={carica.isPending}
            onClick={() => input.current?.click()}
            className="inline-flex items-center gap-2 text-[15px] underline-offset-4 hover:underline disabled:opacity-50 pointer-coarse:min-h-9"
          >
            <Plus className="size-4" aria-hidden /> {carica.isPending ? "Carico…" : "Aggiungi un documento"}
          </button>
          <input
            ref={input}
            type="file"
            accept={ACCETTA}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) carica.mutate(f);
              e.target.value = "";
            }}
          />
          <span className="mt-1 block text-[12px] text-muted-foreground sm:mt-0 sm:ml-3 sm:inline">PDF, immagini, testo, Word, PowerPoint · 15 MB</span>
        </div>
      ) : null}
    </section>
  );
}
