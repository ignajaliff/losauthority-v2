import { Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { TUTTI_GLI_SCOPE } from "../types";

interface ErroriFiltriProps {
  scopes: string[];
  scope: string;
  onScopeChange: (scope: string) => void;
  ricerca: string;
  onRicercaChange: (testo: string) => void;
}

/** Filtro per scope (quelli presenti nei dati) e ricerca testuale sul messaggio. */
export function ErroriFiltri({ scopes, scope, onScopeChange, ricerca, onRicercaChange }: ErroriFiltriProps) {
  const items: Record<string, string> = {
    [TUTTI_GLI_SCOPE]: "Tutti gli scope",
    ...Object.fromEntries(scopes.map((s) => [s, s])),
  };

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="grid flex-1 gap-1.5">
        <Label htmlFor="errori-ricerca">Cerca nel messaggio</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="errori-ricerca"
            type="search"
            className="pl-8"
            placeholder="Es. Notion, timeout, cliente…"
            value={ricerca}
            onChange={(e) => onRicercaChange(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-1.5 sm:w-56">
        <Label htmlFor="errori-scope">Scope</Label>
        <Select value={scope} items={items} onValueChange={(v) => onScopeChange(typeof v === "string" ? v : TUTTI_GLI_SCOPE)}>
          <SelectTrigger id="errori-scope" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TUTTI_GLI_SCOPE}>Tutti gli scope</SelectItem>
            {scopes.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
