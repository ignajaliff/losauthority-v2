import { useState } from "react";
import { Plus } from "lucide-react";
import { ConfermaEliminazione } from "@/features/fatture";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ErroreCaricamento, SkeletonRighe, StatoVuoto } from "@/shared/components/layout/StatoCaricamento";
import { formatCurrency, sumImporti } from "@/shared/utils/formatCurrency";
import { todayIso } from "@/shared/utils/formatDate";
import { useEliminaSpesa, useSpese } from "../hooks/useSpese";
import type { Spesa, TipoSpesa } from "../types";
import { ScansionaScontrino } from "./ScansionaScontrino";
import { SpesaForm } from "./SpesaForm";
import { SpesaModificaDialog } from "./SpesaModificaDialog";
import { SpeseTabella } from "./SpeseTabella";

interface SezioneSpeseProps {
  titolo: string;
  sottotitolo: string;
  riepilogo: string;
  tipo: TipoSpesa;
  spese: Spesa[];
  vuoto: string;
  onAggiungi: () => void;
  onModifica: (spesa: Spesa) => void;
  onElimina: (spesa: Spesa) => void;
}

function SezioneSpese({ titolo, sottotitolo, riepilogo, tipo, spese, vuoto, onAggiungi, onModifica, onElimina }: SezioneSpeseProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{titolo}</CardTitle>
            <CardDescription>{sottotitolo}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">{riepilogo}</span>
            <Button variant="outline" size="sm" onClick={onAggiungi}>
              <Plus /> Aggiungi
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {spese.length === 0 ? <StatoVuoto titolo={vuoto} /> : <SpeseTabella spese={spese} tipo={tipo} onModifica={onModifica} onElimina={onElimina} />}
      </CardContent>
    </Card>
  );
}

/** Tab Spese: scontrino con AI, spese variabili, spese fisse, form manuale. */
export function TabSpese() {
  const { data: spese, isLoading, isError } = useSpese();
  const elimina = useEliminaSpesa();
  const [formTipo, setFormTipo] = useState<TipoSpesa | null>(null);
  const [daModificare, setDaModificare] = useState<Spesa | null>(null);
  const [daEliminare, setDaEliminare] = useState<Spesa | null>(null);

  const variabili = (spese ?? []).filter((s) => s.tipo === "variabile");
  const fisse = (spese ?? []).filter((s) => s.tipo === "fissa");
  const meseCorrente = todayIso().slice(0, 7);
  const variabiliMese = sumImporti(variabili.filter((s) => s.data.startsWith(meseCorrente)).map((s) => s.importo));
  const fisseMese = sumImporti(fisse.filter((s) => s.attiva).map((s) => s.importo));

  function confermaEliminazione() {
    if (!daEliminare) return;
    elimina.mutate(daEliminare, { onSuccess: () => setDaEliminare(null) });
  }

  if (isLoading) return <SkeletonRighe righe={6} />;
  if (isError) return <ErroreCaricamento />;

  return (
    <div className="grid gap-4">
      <ScansionaScontrino />

      <SezioneSpese
        titolo="Spese variabili"
        sottotitolo="Una tantum: scontrini, ads, acquisti singoli, imprevisti."
        riepilogo={`questo mese ${formatCurrency(variabiliMese)}`}
        tipo="variabile"
        spese={variabili}
        vuoto="Ancora nessuna spesa variabile: fotografa uno scontrino qui sopra o aggiungila a mano."
        onAggiungi={() => setFormTipo("variabile")}
        onModifica={setDaModificare}
        onElimina={setDaEliminare}
      />

      <SezioneSpese
        titolo="Spese fisse"
        sottotitolo="Si ripetono ogni mese (affitto, tool, abbonamenti). Sospendile quando disdici."
        riepilogo={`${formatCurrency(fisseMese)}/mese`}
        tipo="fissa"
        spese={fisse}
        vuoto="Nessuna spesa fissa: aggiungi affitto e abbonamenti con «Aggiungi»."
        onAggiungi={() => setFormTipo("fissa")}
        onModifica={setDaModificare}
        onElimina={setDaEliminare}
      />

      {formTipo ? (
        <SpesaForm
          key={formTipo}
          open
          tipoIniziale={formTipo}
          onOpenChange={(aperto) => {
            if (!aperto) setFormTipo(null);
          }}
        />
      ) : null}
      <SpesaModificaDialog spesa={daModificare} onClose={() => setDaModificare(null)} />
      <ConfermaEliminazione
        open={daEliminare !== null}
        onOpenChange={(aperto) => {
          if (!aperto) setDaEliminare(null);
        }}
        titolo="Eliminare questa spesa?"
        descrizione={
          daEliminare
            ? `«${daEliminare.descrizione}» da ${formatCurrency(daEliminare.importo)}${daEliminare.ricevuta_path ? ". Verrà eliminata anche la foto." : "."}`
            : ""
        }
        inCorso={elimina.isPending}
        onConferma={confermaEliminazione}
      />
    </div>
  );
}
