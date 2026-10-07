import { useState } from "react";
import { CopiaButton } from "@/features/clienti/components/CopiaButton";
import { Button } from "@/shared/components/ui/button";
import { dataEstesa, oggiInItalia } from "@contratti/documento.ts";
import { CONSEGNE_ATTIVAZIONE } from "@contratti/tipi.ts";
import { useAttivaContratto, type EsitoAttivazione } from "../../hooks/useContrattoAzioni";

interface AttivazionePanelProps {
  id: string;
  programma: string;
  privato: boolean;
  /** Dati dell'attivazione già avvenuta (null finché il contratto è solo pagato). */
  attivo: { il: string; scadeIl: string | null; recessoFinoAl: string | null } | null;
}

function messaggioAttivazione(e: EsitoAttivazione, programma: string): string {
  const link = `${window.location.origin}/area`;
  return (
    `Ciao${e.nome ? ` ${e.nome}` : ""}!\n` +
    `Il tuo programma ${programma} è attivo da oggi, ${dataEstesa(oggiInItalia())}: da questo momento hai tutti gli accessi.\n\n` +
    `- Moduli ${programma}: sbloccati nella community Skool\n` +
    `- Chiamate di gruppo settimanali e gruppo WhatsApp: sei dentro\n` +
    `- La tua area sul sito: ${link}\n` +
    `  Email: ${e.email ?? ""}\n` +
    (e.password ? `  Password: ${e.password}\n` : `  Password: quella che usi già\n`) +
    `\nPer la chiamata individuale di onboarding ci accordiamo io e te.\n` +
    `Questa è la comunicazione di attivazione prevista dal contratto: i 6 mesi partono da oggi e finiscono il ${dataEstesa(e.scade_il)}.`
  );
}

/**
 * «Attiva»: Wesley spunta le consegne che ha fatto a mano (Skool, WhatsApp, chiamate), poi attiva.
 * Solo allora nascono le credenziali e il messaggio di attivazione da mandare al cliente: da quel
 * giorno partono i 6 mesi. Dopo l'attivazione il messaggio con la password resta a schermo (si vede una volta sola).
 */
export function AttivazionePanel({ id, programma, privato, attivo }: AttivazionePanelProps) {
  const [fatte, setFatte] = useState<string[]>([]);
  const [esito, setEsito] = useState<EsitoAttivazione | null>(null);
  const attiva = useAttivaContratto(id);
  const tutte = CONSEGNE_ATTIVAZIONE.every((c) => fatte.includes(c.id));

  if (esito) {
    const messaggio = messaggioAttivazione(esito, programma);
    const mailto = `mailto:${encodeURIComponent(esito.email ?? "")}?subject=${encodeURIComponent(`Il tuo programma ${programma} è attivo`)}&body=${encodeURIComponent(messaggio)}`;
    return (
      <div className="grid gap-3.5">
        <p className="text-sm font-semibold text-status-active">Programma attivato. Manda subito questo messaggio via email: è la comunicazione di attivazione.</p>
        <p className="text-[13px] text-muted-foreground">
          {esito.password
            ? "La password si vede solo ora: se chiudi la pagina senza copiarla, la rigeneri dalla scheda del cliente."
            : "Questo cliente aveva già un account: usa la password che ha già."}
          {privato ? " Per i privati da oggi decorrono anche i 14 giorni di recesso." : ""}
        </p>
        <pre className="rounded-md border bg-muted/40 p-4 font-mono text-[13px] leading-relaxed break-words whitespace-pre-wrap">{messaggio}</pre>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => window.open(mailto, "_self")}>
            Apri nella posta
          </Button>
          <CopiaButton testo={messaggio} etichetta="Copia messaggio" />
          {esito.password ? <CopiaButton testo={esito.password} etichetta="Solo password" /> : null}
        </div>
      </div>
    );
  }

  if (attivo) {
    return (
      <div className="grid gap-1.5 text-[13.5px] text-muted-foreground">
        <p>
          Attivato il <strong className="text-foreground">{dataEstesa(oggiInItalia(new Date(attivo.il)))}</strong>
          {attivo.scadeIl ? (
            <>
              {" "}
              · scade il <strong className="text-foreground">{dataEstesa(attivo.scadeIl)}</strong>
            </>
          ) : null}
        </p>
        {attivo.recessoFinoAl ? <p>Recesso possibile fino al {dataEstesa(attivo.recessoFinoAl)} (privato, 14 giorni).</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <p className="text-[13.5px] text-muted-foreground">
        Spunta le consegne man mano che le fai. Quando sono tutte fatte, attiva: nascono le credenziali del sito e il messaggio di attivazione da mandare al cliente.
      </p>
      {CONSEGNE_ATTIVAZIONE.map((c) => (
        <label key={c.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={fatte.includes(c.id)}
            onChange={(e) => setFatte((f) => (e.target.checked ? [...f, c.id] : f.filter((x) => x !== c.id)))}
            className="size-[18px] accent-foreground"
          />
          {c.label}
        </label>
      ))}
      <div>
        <Button disabled={attiva.isPending || !tutte} onClick={() => attiva.mutate(fatte, { onSuccess: setEsito })}>
          {attiva.isPending ? "Attivo…" : "Attiva il programma"}
        </Button>
      </div>
    </div>
  );
}
