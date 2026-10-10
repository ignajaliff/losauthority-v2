import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { useAggiornaColore, useAggiungiColore, useEliminaColore } from "../hooks/useKitBrand";
import { type ColoreBrand, MAX_COLORI, normalizzaHex, RUOLI_COLORE, type RuoloColore, testoSu } from "../types";
import { TestoInLinea } from "./TestoInLinea";

interface FasciaColoriProps {
  clienteId: string;
  colori: ColoreBrand[];
}

const RUOLO_ETICHETTA = Object.fromEntries(RUOLI_COLORE.map((r) => [r.valore, r.etichetta])) as Record<string, string>;

/** Il pannello che si apre toccando una banda: selettore nativo, hex a mano, ruolo, elimina. */
function PannelloColore({ colore, clienteId }: { colore: ColoreBrand; clienteId: string }) {
  const aggiorna = useAggiornaColore(clienteId);
  const elimina = useEliminaColore(clienteId);
  const [hex, setHex] = useState(colore.hex);

  function salvaHex(raw: string) {
    const n = normalizzaHex(raw);
    if (!n) {
      toast.error("Codice colore non valido", { description: "Scrivilo come #1a2b3c." });
      setHex(colore.hex);
      return;
    }
    setHex(n);
    if (n !== colore.hex) aggiorna.mutate({ id: colore.id, hex: n });
  }

  return (
    <div className="grid w-64 gap-3">
      <label className="grid gap-1.5">
        <span className="eyebrow text-[10px]">Colore</span>
        <span className="flex items-center gap-2">
          <input
            type="color"
            value={hex}
            aria-label="Scegli il colore"
            onChange={(e) => setHex(e.target.value)}
            onBlur={(e) => salvaHex(e.target.value)}
            className="size-9 cursor-pointer rounded-sm border bg-transparent p-0.5"
          />
          <input
            type="text"
            value={hex}
            maxLength={7}
            aria-label="Codice esadecimale"
            onChange={(e) => setHex(e.target.value)}
            onBlur={(e) => salvaHex(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && salvaHex(hex)}
            className="figure h-9 w-full rounded-sm border bg-card px-2 text-base outline-none focus-visible:border-primary md:text-sm"
          />
        </span>
      </label>
      <label className="grid gap-1.5">
        <span className="eyebrow text-[10px]">Ruolo</span>
        <select
          value={colore.ruolo}
          onChange={(e) => aggiorna.mutate({ id: colore.id, ruolo: e.target.value as RuoloColore })}
          className="h-9 rounded-sm border bg-card px-2 text-base md:text-sm"
        >
          {RUOLI_COLORE.map((r) => (
            <option key={r.valore} value={r.valore}>
              {r.etichetta}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={elimina.isPending}
        onClick={() => elimina.mutate(colore.id)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-status-churn hover:underline pointer-coarse:min-h-9"
      >
        <Trash2 className="size-3" aria-hidden /> Togli dalla palette
      </button>
    </div>
  );
}

/**
 * La palette come fascia a tutta larghezza: ogni colore è una banda, con l'hex
 * scritto sopra in monospace e il nome sotto. Si tocca la banda per cambiarla,
 * il «+» in coda aggiunge un colore. Nessuna card.
 */
export function FasciaColori({ clienteId, colori }: FasciaColoriProps) {
  const aggiungi = useAggiungiColore(clienteId);
  const aggiorna = useAggiornaColore(clienteId);
  const pieno = colori.length >= MAX_COLORI;

  function nuovo() {
    if (pieno) return;
    // Parte da un grigio neutro: il cliente lo cambia subito dal pannello.
    aggiungi.mutate({ hex: "#9ba1ab", ordine: (colori.at(-1)?.ordine ?? -1) + 1 });
  }

  return (
    <section aria-labelledby="kit-colori" className="grid gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="kit-colori" className="eyebrow shrink-0 text-[10px]">
          Colori · {colori.length}
        </h3>
        <span className="text-[12px] text-muted-foreground">Tocca una banda per cambiarla</span>
      </div>

      {/* A sangue: esce dai margini del contenitore (gli stessi della ClientShell: 16 / 24 / 32 px).
          Sul telefono, con tanti colori, la fascia scorre di lato invece di schiacciare le bande. */}
      <div className="-mx-4 flex min-h-[160px] overflow-hidden max-sm:overflow-x-auto max-sm:overscroll-x-contain sm:-mx-6 md:-mx-8 md:min-h-[200px]">
        {colori.length === 0 ? (
          <button
            type="button"
            onClick={nuovo}
            disabled={aggiungi.isPending}
            className="grid flex-1 place-items-center gap-2 border-y border-dashed text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <Plus className="size-6" aria-hidden />
            <span className="font-display text-xl">Il primo colore della palette</span>
          </button>
        ) : (
          colori.map((c, i) => (
            <Popover key={c.id}>
              <PopoverTrigger
                className={cn("group relative min-w-0 flex-1 outline-none transition-[flex] duration-300 hover:flex-[1.4] focus-visible:flex-[1.4] max-sm:min-w-[76px]", i === 0 && "rounded-l-none")}
                style={{ background: c.hex, color: testoSu(c.hex) }}
                aria-label={`Colore ${c.hex}${c.nome ? `, ${c.nome}` : ""}`}
              >
                <span className="absolute top-3 left-3 figure text-[12px] tracking-wide opacity-90">{c.hex}</span>
                {c.ruolo !== "altro" ? (
                  <span className="absolute right-3 bottom-3 text-[10px] tracking-[0.18em] uppercase opacity-80">{RUOLO_ETICHETTA[c.ruolo]}</span>
                ) : null}
              </PopoverTrigger>
              <PopoverContent align="start" className="p-4">
                <PannelloColore colore={c} clienteId={clienteId} />
              </PopoverContent>
            </Popover>
          ))
        )}
        {colori.length > 0 && !pieno ? (
          <button
            type="button"
            onClick={nuovo}
            disabled={aggiungi.isPending}
            aria-label="Aggiungi un colore"
            title="Aggiungi un colore"
            className="grid w-14 shrink-0 place-items-center border-l border-dashed text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>

      {colori.length > 0 ? (
        <ol className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
          {colori.map((c) => (
            <li key={c.id} className="flex min-w-[140px] items-center gap-2">
              <span className="size-3 shrink-0 rounded-full border border-foreground/10" style={{ background: c.hex }} aria-hidden />
              <TestoInLinea
                valore={c.nome}
                segnaposto="Dagli un nome"
                etichetta={`Nome del colore ${c.hex}`}
                maxLength={60}
                className="text-[13px]"
                onSalva={(nome) => aggiorna.mutate({ id: c.id, nome: nome || null })}
              />
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
