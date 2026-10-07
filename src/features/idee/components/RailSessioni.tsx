import { PanelLeftClose, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { formatDateShort } from "@/shared/utils/formatDate";
import { cn } from "@/lib/utils";
import type { Sessione } from "../types";

interface RailSessioniProps {
  sessioni: Sessione[];
  correnteId: string | null;
  onApri: (id: string) => void;
  onNuova: () => void;
  onChiudi: () => void;
}

/** Pannello delle conversazioni: si apre a sinistra dello studio e si richiude per dare tutto lo spazio alla chat. */
export function RailSessioni({ sessioni, correnteId, onApri, onNuova, onChiudi }: RailSessioniProps) {
  return (
    <aside aria-label="Conversazioni" className="flex h-full flex-col gap-3 animate-in fade-in slide-in-from-left-2 duration-300 motion-reduce:animate-none">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow px-1 text-[10px]">Conversazioni</p>
        <Button size="icon" variant="ghost" className="size-7 text-muted-foreground" aria-label="Nascondi conversazioni" onClick={onChiudi}>
          <PanelLeftClose className="size-4" aria-hidden />
        </Button>
      </div>
      <Button variant="outline" className="justify-start" onClick={onNuova} disabled={correnteId === null}>
        <Plus aria-hidden /> Nuova sessione
      </Button>
      {sessioni.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">Le sessioni con Aura compariranno qui.</p>
      ) : (
        <ul className="grid min-h-0 gap-0.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {sessioni.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onApri(s.id)}
                aria-current={s.id === correnteId ? "true" : undefined}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/70",
                  s.id === correnteId ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                <span className="block truncate text-[13.5px]">{s.titolo}</span>
                <span className="block text-[11px] text-muted-foreground">{formatDateShort(s.updated_at)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
