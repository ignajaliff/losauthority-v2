import type { Json } from "@/integrations/supabase/types";

function eOggetto(valore: Json | undefined): valore is { [key: string]: Json | undefined } {
  return typeof valore === "object" && valore !== null && !Array.isArray(valore);
}

/** Rappresentazione leggibile di un valore del context (primitive in chiaro, strutture compatte). */
function testoValore(valore: Json | undefined): string {
  if (valore === null || valore === undefined) return "—";
  if (typeof valore === "string") return valore;
  if (typeof valore === "number" || typeof valore === "boolean") return String(valore);
  return JSON.stringify(valore);
}

/** Il `context` di un errore come lista chiave: valore, non JSON crudo. */
export function ContextLista({ context }: { context: Json | null }) {
  if (context === null || context === undefined) {
    return <p className="text-xs text-muted-foreground">Nessun dettaglio aggiuntivo.</p>;
  }

  if (!eOggetto(context)) {
    return <code className="block break-all font-mono text-xs">{testoValore(context)}</code>;
  }

  const voci = Object.entries(context);
  if (voci.length === 0) {
    return <p className="text-xs text-muted-foreground">Nessun dettaglio aggiuntivo.</p>;
  }

  return (
    <dl className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-[max-content_1fr]">
      {voci.map(([chiave, valore]) => (
        <div key={chiave} className="contents">
          <dt className="font-medium text-muted-foreground">{chiave}</dt>
          <dd className="min-w-0 break-words font-mono whitespace-pre-wrap">{testoValore(valore)}</dd>
        </div>
      ))}
    </dl>
  );
}
