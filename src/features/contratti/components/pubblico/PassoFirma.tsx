import { Button } from "@/shared/components/ui/button";
import type { DocumentoContratto, Firma } from "@contratti/tipi.ts";
import { FirmaPad } from "../FirmaPad";
import { FirmaSvg } from "../FirmaSvg";
import { Inline, TestoContratto } from "../TestoContratto";
import { Avviso, Spunta } from "./Spunta";

interface PassoFirmaProps {
  documento: DocumentoContratto;
  firmaFornitore: Firma | null;
  accetto: boolean;
  approvo: boolean;
  firma1: Firma | null;
  firma2: Firma | null;
  messaggio: string | null;
  inviando: boolean;
  onAccetto: (v: boolean) => void;
  onApprovo: (v: boolean) => void;
  onFirma1: (f: Firma | null) => void;
  onFirma2: (f: Firma | null) => void;
  onModifica: () => void;
  onFirma: () => void;
}

/** Passo 4: il contratto composto dal server, da leggere tutto, e le due firme (contratto + approvazione delle clausole). */
export function PassoFirma(p: PassoFirmaProps) {
  const pronto = p.accetto && p.approvo && !!p.firma1 && !!p.firma2;
  return (
    <>
      <h1 className="text-[30px] leading-[1.15]">Leggi e firma</h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground">Questo è il tuo contratto, con i dati che hai inserito. Leggilo tutto: le firme sono in fondo.</p>
      <Button variant="outline" size="sm" className="w-fit" onClick={p.onModifica} disabled={p.inviando}>
        Modifica i dati
      </Button>

      <div className="grid gap-6 rounded-lg border bg-card px-5 py-6 shadow-sm sm:px-6">
        <TestoContratto blocchi={p.documento.corpo} />
        {p.documento.allegati.length > 0 ? (
          <div className="border-t pt-5">
            <TestoContratto blocchi={p.documento.allegati} />
          </div>
        ) : null}
      </div>

      <h2 className="text-[24px] leading-tight">Firme</h2>

      <div className="grid gap-2">
        <p className="text-[15px] font-semibold text-foreground">{p.documento.firmatario_fornitore}</p>
        {p.firmaFornitore ? (
          <div className="rounded-md border bg-card px-3.5 py-2.5">
            <FirmaSvg firma={p.firmaFornitore} altezza={64} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Il Fornitore firma la tua copia dopo di te.</p>
        )}
      </div>

      <div className="grid gap-2.5">
        <p className="text-[15px] font-semibold text-foreground">{p.documento.firmatario_cliente}</p>
        <Spunta checked={p.accetto} onChange={p.onAccetto}>
          Ho letto il contratto e lo accetto.
        </Spunta>
        <FirmaPad onChange={p.onFirma1} etichetta="Firma qui, col dito o col mouse" disabled={p.inviando} />
      </div>

      <div className="grid gap-2.5">
        <p className="text-[15px] leading-relaxed text-foreground">
          <Inline testo={p.documento.approvazione} />
        </p>
        <Spunta checked={p.approvo} onChange={p.onApprovo}>
          Approvo specificamente le clausole elencate qui sopra.
        </Spunta>
        <FirmaPad onChange={p.onFirma2} etichetta="Seconda firma: approvazione delle clausole" disabled={p.inviando} />
      </div>

      <Avviso testo={p.messaggio} />
      <Button size="lg" className="h-auto min-h-[54px] w-full whitespace-normal py-3" disabled={p.inviando || !pronto} onClick={p.onFirma}>
        {p.inviando ? "Registro le firme…" : "Scarica il contratto firmato"}
      </Button>
      <p className="text-center text-[13px] text-muted-foreground">Premendo, le tue firme vengono registrate e scarichi la tua copia.</p>
    </>
  );
}
