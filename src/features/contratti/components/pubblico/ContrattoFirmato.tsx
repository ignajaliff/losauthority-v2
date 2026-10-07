import { Check, Download } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { istanteInItalia } from "@contratti/documento.ts";
import { FORNITORE } from "@contratti/fornitore.ts";
import { urlPdfPubblico } from "../../api-pubblica";

interface ContrattoFirmatoProps {
  token: string;
  firmatoIl: string;
  istruzioniPagamento: string | null;
  appenaFirmato?: boolean;
}

/** Ciò che il cliente vede dopo la firma (subito, e ogni volta che riapre il suo link): la copia da scaricare e cosa succede adesso. */
export function ContrattoFirmato({ token, firmatoIl, istruzioniPagamento, appenaFirmato = false }: ContrattoFirmatoProps) {
  const mailto =
    `mailto:${FORNITORE.email}` +
    `?subject=${encodeURIComponent("Contratto firmato")}` +
    `&body=${encodeURIComponent("Ciao Wesley,\nin allegato il contratto che ho firmato.\n")}`;
  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3.5">
        <span aria-hidden className="grid size-[46px] shrink-0 place-items-center rounded-full bg-status-active-soft text-status-active">
          <Check className="size-6" strokeWidth={2} />
        </span>
        <div>
          <h1 className="text-[30px] leading-[1.15]">{appenaFirmato ? "Contratto firmato" : "Hai già firmato questo contratto"}</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Firmato il {istanteInItalia(firmatoIl)} (ora italiana)</p>
        </div>
      </div>

      <section className="grid gap-3 rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-[15px] font-semibold">1. Scarica il contratto</p>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Il PDF contiene il contratto con le firme. Conservalo: puoi riaprire questo link in qualsiasi momento per scaricarlo di nuovo.
        </p>
        <Button size="lg" className="w-fit" nativeButton={false} render={<a href={urlPdfPubblico(token)} />}>
          <Download aria-hidden /> Scarica il contratto firmato
        </Button>
      </section>

      <section className="grid gap-3 rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-[15px] font-semibold">2. Mandalo a Wesley per email</p>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Invia il PDF che hai scaricato a <strong className="break-all text-foreground">{FORNITORE.email}</strong>, dalla tua email. Ricordati di allegare il file.
        </p>
        <Button size="lg" variant="outline" className="w-fit" nativeButton={false} render={<a href={mailto} />}>
          Apri l'email
        </Button>
      </section>

      <section className="grid gap-3 rounded-lg border bg-card p-5 shadow-sm">
        <p className="text-[15px] font-semibold">3. Poi?</p>
        {istruzioniPagamento ? <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-muted-foreground">{istruzioniPagamento}</p> : null}
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Wesley ti apre gli accessi e ti manda la comunicazione di attivazione: i 6 mesi partono da quel giorno.
        </p>
      </section>
    </div>
  );
}
