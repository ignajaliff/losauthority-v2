import { useState } from "react";
import { CartaAvatar, codiceAvatar, DiagnosiAvatar, DossierAvatar, useAvatars, useDiagnosiAvatar } from "@/features/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { ErroreCaricamento, SkeletonBlocco, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { formatDate } from "@/shared/utils/formatDate";
import { cn } from "@/lib/utils";
import type { ClienteDettaglio } from "../types";

/**
 * Tab "Avatar" della scheda cliente: gli avatar che il cliente ha definito con
 * Aura. Il team vede la carta, il dossier e, in più, la DIAGNOSI per Wesley
 * (tabella avatar_diagnosi, che il cliente non legge).
 */
export function AvatarTab({ cliente }: { cliente: ClienteDettaglio }) {
  const { data, isLoading, isError } = useAvatars(cliente.id);
  const [sceltoId, setSceltoId] = useState<string | null>(null);
  const avatars = data ?? [];
  const scelto = avatars.find((a) => a.id === sceltoId) ?? avatars.find((a) => a.stato === "completo") ?? avatars[0] ?? null;
  const numero = scelto ? avatars.findIndex((a) => a.id === scelto.id) + 1 : 1;
  const diagnosi = useDiagnosiAvatar(scelto?.id);

  if (isLoading) return <SkeletonBlocco altezza="h-64" />;
  if (isError) return <ErroreCaricamento />;
  if (avatars.length === 0) {
    return <StatoVuoto titolo="Nessun avatar ancora" testo="Il cliente lo definisce dalla sua area: Cervello del tuo branding → Avatar, in conversazione con Aura." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
      <nav aria-label="Avatar del cliente" className="grid gap-2">
        {avatars.map((a, i) => {
          const attivo = scelto?.id === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setSceltoId(a.id)}
              aria-current={attivo ? "true" : undefined}
              className={cn(
                "grid gap-1 rounded-lg border p-3 text-left transition-colors",
                attivo ? "border-foreground/40 bg-card shadow-xs" : "border-border bg-card/60 hover:bg-card",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="figure text-[10px] tracking-[0.12em] text-muted-foreground">{codiceAvatar(i + 1)}</span>
                <Badge variant={a.stato === "completo" ? "active" : "neutral"} dot>
                  {a.stato === "completo" ? "Completo" : "In compilazione"}
                </Badge>
              </span>
              <span className="truncate font-display text-[20px] leading-tight font-medium">{a.nome ?? "Senza nome"}</span>
              <span className="truncate text-xs text-muted-foreground">
                {[a.eta, a.genere, a.situazione].filter(Boolean).join(" · ") || `Creato il ${formatDate(a.created_at)}`}
              </span>
            </button>
          );
        })}
      </nav>

      {scelto ? (
        <div className="grid min-w-0 gap-5">
          <CartaAvatar
            avatar={scelto}
            numero={numero}
            titolare={`${cliente.utente.nombre}${scelto.settore ? ` · ${scelto.settore}` : ""}`}
            inCompilazione={scelto.stato !== "completo"}
          />
          <DossierAvatar avatar={scelto} numero={numero} />
          {diagnosi.isError ? <ErroreCaricamento /> : <DiagnosiAvatar diagnosi={diagnosi.data ?? null} completo={scelto.stato === "completo"} />}
        </div>
      ) : null}
    </div>
  );
}
