import { Link } from "react-router-dom";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stile } from "../types";

interface MenuStiliProps {
  /** Stili pronti, già filtrati con la query dopo "/". */
  voci: Stile[];
  /** Testo digitato dopo "/", per il messaggio "nessun risultato". */
  query: string;
  attiva: number;
  onScegli: (stile: Stile) => void;
  onPassaSopra: (indice: number) => void;
  /** true se il cliente non ha ancora nessuno stile pronto. */
  nessunoStile: boolean;
}

/** Il menu "/" del composer: gli stili del cliente da agganciare al messaggio. */
export function MenuStili({ voci, query, attiva, onScegli, onPassaSopra, nessunoStile }: MenuStiliProps) {
  return (
    <div
      role="listbox"
      id="menu-stili"
      aria-label="I tuoi stili"
      className="absolute inset-x-0 bottom-[calc(100%+8px)] z-20 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-md animate-in fade-in slide-in-from-bottom-2 duration-150 motion-reduce:animate-none"
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="eyebrow text-[10px]">I tuoi stili</p>
        <span className="text-[11px] text-muted-foreground">↑↓ scegli · Invio usa · Esc chiudi</span>
      </div>
      {nessunoStile ? (
        <p className="px-3 py-3 text-sm text-muted-foreground">
          Non hai ancora stili pronti.{" "}
          <Link to="/area/stili" className="text-foreground underline underline-offset-4">
            Creane uno nella pagina Stili
          </Link>
          : incolli qualche script dello stesso stile e Aura impara a rifarlo per te.
        </p>
      ) : voci.length === 0 ? (
        <p className="px-3 py-3 text-sm text-muted-foreground">Nessuno stile con «{query}».</p>
      ) : (
        <ul className="max-h-64 overflow-y-auto p-1 [scrollbar-width:thin]">
          {voci.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === attiva}
                onMouseEnter={() => onPassaSopra(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onScegli(s)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                  i === attiva ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <Palette className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{s.titolo}</span>
                  {s.descrizione ? <span className="block truncate text-xs text-muted-foreground">{s.descrizione}</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
