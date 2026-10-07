import { useState } from "react";
import { CalendarDays, Columns3, Plus } from "lucide-react";
import { useAuth } from "@/features/auth";
import { primoNome } from "@/features/scheda";
import {
  BoardContenuti,
  CalendarioContenuti,
  ContenutoDialog,
  useContenuti,
  useRipianificaContenuto,
  useSpostaContenuto,
  type Contenuto,
} from "@/features/contenuti";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

type Vista = "board" | "calendario";

const SUGGERIMENTO: Record<Vista, string> = {
  board: "Trascina una card per cambiarle stato.",
  calendario: "Trascina un contenuto su un giorno per pianificarne la pubblicazione.",
};

/** /area/workflow → pipeline dei video del cliente: tabella per stato o calendario per data prevista. */
export default function WorkflowPage() {
  const { utente } = useAuth();
  const clienteId = utente?.id ?? "";
  const contenuti = useContenuti(utente?.id);
  const sposta = useSpostaContenuto(clienteId);
  const ripianifica = useRipianificaContenuto(clienteId);
  const [vista, setVista] = useState<Vista>("board");
  const [dialog, setDialog] = useState<{ open: boolean; contenuto: Contenuto | null }>({ open: false, contenuto: null });

  if (!utente) return null;
  const nome = primoNome(utente.nombre);
  const totale = contenuti.data?.length ?? 0;
  const pubblicati = contenuti.data?.filter((c) => c.stato === "pubblicato").length ?? 0;
  const conteggio =
    totale > 0
      ? `${totale} ${totale === 1 ? "contenuto" : "contenuti"} · ${pubblicati} ${pubblicati === 1 ? "pubblicato" : "pubblicati"}.`
      : "Le idee dei tuoi video, dalla scrittura alla pubblicazione.";
  const apri = (c: Contenuto) => setDialog({ open: true, contenuto: c });

  return (
    <div className="grid gap-2">
      <PageHeader
        occhiello={`Il tuo percorso${nome ? ` · ${nome}` : ""}`}
        titolo="Workflow"
        sottotitolo={`${conteggio} ${SUGGERIMENTO[vista]}`}
        azioni={
          <>
            <Tabs value={vista} onValueChange={(v) => setVista(v === "calendario" ? "calendario" : "board")}>
              <TabsList aria-label="Vista">
                <TabsTrigger value="board">
                  <Columns3 aria-hidden /> Tabella
                </TabsTrigger>
                <TabsTrigger value="calendario">
                  <CalendarDays aria-hidden /> Calendario
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" onClick={() => setDialog({ open: true, contenuto: null })}>
              <Plus aria-hidden />
              Nuova idea
            </Button>
          </>
        }
      />

      {contenuti.isLoading ? <SkeletonBlocco altezza="h-64" /> : null}
      {contenuti.isError ? <ErroreCaricamento /> : null}
      {contenuti.data && vista === "board" ? (
        <BoardContenuti contenuti={contenuti.data} onApri={apri} onSposta={(id, stato) => sposta.mutate({ id, stato })} />
      ) : null}
      {contenuti.data && vista === "calendario" ? (
        <CalendarioContenuti
          contenuti={contenuti.data}
          onApri={apri}
          onRipianifica={(id, data) => ripianifica.mutate({ id, pubblicazione_prevista: data })}
        />
      ) : null}

      <ContenutoDialog
        clienteId={clienteId}
        open={dialog.open}
        contenuto={dialog.contenuto}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </div>
  );
}
