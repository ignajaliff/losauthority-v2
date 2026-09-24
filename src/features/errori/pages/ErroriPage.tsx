import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonRighe, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";
import { ErroriFiltri } from "../components/ErroriFiltri";
import { ErroriTabella } from "../components/ErroriTabella";
import { useErrori } from "../hooks/useErrori";
import { TUTTI_GLI_SCOPE } from "../types";

export default function ErroriPage() {
  const { data: errori, isLoading, isError, isFetching, refetch } = useErrori();
  const [scope, setScope] = useState<string>(TUTTI_GLI_SCOPE);
  const [ricerca, setRicerca] = useState("");

  const scopes = useMemo(() => Array.from(new Set((errori ?? []).map((e) => e.scope))).sort(), [errori]);

  const filtrati = useMemo(() => {
    const termine = ricerca.trim().toLowerCase();
    return (errori ?? []).filter(
      (e) =>
        (scope === TUTTI_GLI_SCOPE || e.scope === scope) &&
        (termine === "" || e.message.toLowerCase().includes(termine)),
    );
  }, [errori, scope, ricerca]);

  return (
    <>
      <PageHeader
        titolo="Errori"
        sottotitolo="Ultimi 100 errori registrati dalle automazioni (sola lettura)"
        azioni={
          <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={cn(isFetching && "animate-spin")} aria-hidden />
            Aggiorna
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonRighe righe={8} />
      ) : isError ? (
        <ErroreCaricamento />
      ) : !errori || errori.length === 0 ? (
        <StatoVuoto titolo="Nessun errore registrato" testo="Le automazioni non hanno segnalato problemi." />
      ) : (
        <>
          <ErroriFiltri
            scopes={scopes}
            scope={scope}
            onScopeChange={setScope}
            ricerca={ricerca}
            onRicercaChange={setRicerca}
          />
          {filtrati.length === 0 ? (
            <StatoVuoto titolo="Nessun errore corrisponde ai filtri" testo="Prova a cambiare scope o testo di ricerca." />
          ) : (
            <>
              <p className="mb-2 text-xs text-muted-foreground">
                {filtrati.length} di {errori.length} errori
              </p>
              <ErroriTabella errori={filtrati} />
            </>
          )}
        </>
      )}
    </>
  );
}
