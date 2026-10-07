import { useState } from "react";
import { Download } from "lucide-react";
import { Link } from "react-router-dom";
import { CopiaButton } from "@/features/clienti/components/CopiaButton";
import { ConfermaEliminazione } from "@/features/fatture";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { dataEstesa, euroContratto, istanteInItalia } from "@contratti/documento.ts";
import { STATI_APERTI, STATI_FIRMATI, statoMeta, tipoLabel, type DatiCliente } from "@contratti/tipi.ts";
import { useAnnullaInvito, useEliminaInvito } from "../../hooks/useContratti";
import { useScaricaPdfContratto } from "../../hooks/useContrattoAzioni";
import { linkContratto, messaggioInvito, type Contratto } from "../../types";
import { AttivazionePanel } from "./AttivazionePanel";
import { CardContratto, Riga } from "./DatiContratto";
import { righeDati } from "./righeDati";
import { SegnaPagatoForm } from "./SegnaPagatoForm";

interface ContrattoDettaglioProps {
  c: Contratto;
  isAdmin: boolean;
  onEliminato: () => void;
}

/** La scheda di un contratto nel gestionale: link, dati, firma, pagamento, attivazione. */
export function ContrattoDettaglio({ c, isAdmin, onEliminato }: ContrattoDettaglioProps) {
  const stato = statoMeta(c.stato, !!c.aperto_il);
  const aperto = STATI_APERTI.includes(c.stato);
  const firmato = STATI_FIRMATI.includes(c.stato);
  const nome = c.cliente_nome || "In attesa dei dati";
  const compilato = c.tipo && c.compilato_il ? righeDati(c.tipo, c.dati as DatiCliente) : null;
  const link = linkContratto(c.token);
  const [confermaAnnulla, setConfermaAnnulla] = useState(false);
  const [confermaElimina, setConfermaElimina] = useState(false);
  const annulla = useAnnullaInvito();
  const elimina = useEliminaInvito();
  const pdf = useScaricaPdfContratto();

  return (
    <div className="mx-auto grid max-w-[900px] gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[30px] leading-[1.1] break-words">{nome}</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Offerta {c.offerta_nome || c.programma} · {c.durata_mesi} mesi · <span className="figure">{euroContratto(c.prezzo)} €</span>
            {c.tipo ? ` · ${tipoLabel(c.tipo)}` : ""}
          </p>
          {c.note ? <p className="mt-1 text-[13px] text-muted-foreground/80">{c.note}</p> : null}
        </div>
        <Badge variant={stato.tone} dot>
          {stato.label}
        </Badge>
      </header>

      {aperto ? (
        <CardContratto titolo="Link del cliente" sottotitolo="Personale: vale finché non firma o finché non lo annulli.">
          <code className="block rounded-md border bg-muted/40 px-3 py-2.5 font-mono text-[12.5px] break-all">{link}</code>
          <div className="flex flex-wrap gap-2">
            <CopiaButton testo={messaggioInvito(c.programma, link)} etichetta="Copia messaggio" variant="default" />
            <CopiaButton testo={link} etichetta="Solo link" />
          </div>
          <Riga label="Creato">{istanteInItalia(c.created_at)}</Riga>
          <Riga label="Aperto dal cliente">{c.aperto_il ? istanteInItalia(c.aperto_il) : "non ancora"}</Riga>
          <Riga label="Dati inseriti">{c.compilato_il ? istanteInItalia(c.compilato_il) : "non ancora"}</Riga>
          {isAdmin ? (
            <div>
              <Button variant="destructive" size="sm" onClick={() => setConfermaAnnulla(true)} disabled={annulla.isPending}>
                Annulla invito
              </Button>
            </div>
          ) : null}
        </CardContratto>
      ) : null}

      {c.stato === "annullato" ? (
        <CardContratto titolo="Invito annullato">
          <Riga label="Annullato il">{c.annullato_il ? istanteInItalia(c.annullato_il) : "—"}</Riga>
          {isAdmin ? (
            <div>
              <Button variant="destructive" size="sm" onClick={() => setConfermaElimina(true)} disabled={elimina.isPending}>
                Elimina
              </Button>
            </div>
          ) : null}
        </CardContratto>
      ) : null}

      {firmato && c.firmato_il ? (
        <CardContratto titolo="Contratto firmato" sottotitolo={`${istanteInItalia(c.firmato_il)} (ora italiana)`}>
          <div>
            <Button size="sm" onClick={() => pdf.mutate(c.id)} disabled={pdf.isPending}>
              <Download aria-hidden /> {pdf.isPending ? "Preparo…" : "Scarica il PDF"}
            </Button>
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Dopo la firma il cliente scarica il PDF e te lo manda per email: quella email è una prova in più che l'ha letto e inviato lui. Questa è la stessa
            copia, archiviata dal sistema.
          </p>
          <Riga label="Versione del testo">{c.modello ?? "—"}</Riga>
          <Riga label="Indirizzo IP">{c.firma_ip ?? "non rilevato"}</Riga>
          <Riga label="Dispositivo">{c.firma_user_agent ?? "non rilevato"}</Riga>
          <Riga label="Impronta del testo">
            <span className="figure text-xs">{c.testo_sha256 ?? "—"}</span>
          </Riga>
          <Riga label="Firma del Fornitore">{c.firma_fornitore ? "già sul contratto" : "manca: va controfirmato a mano"}</Riga>
        </CardContratto>
      ) : null}

      {c.stato === "firmato" ? (
        <CardContratto titolo="Pagamento" sottotitolo="Quando l'incasso è arrivato, segnalo: nasce la scheda del cliente. A lui non parte nulla.">
          <SegnaPagatoForm id={c.id} importo={c.prezzo} />
        </CardContratto>
      ) : null}
      {c.stato === "pagato" || c.stato === "attivo" ? (
        <CardContratto titolo="Pagamento">
          <Riga label="Pagato il">{c.pagato_il ? dataEstesa(c.pagato_il) : "—"}</Riga>
          <Riga label="Scheda del cliente">
            {c.cliente_id ? (
              <Link to={`/clienti/${c.cliente_id}`} className="underline underline-offset-4">
                Apri la scheda
              </Link>
            ) : (
              "il cliente è stato eliminato"
            )}
          </Riga>
        </CardContratto>
      ) : null}

      {(c.stato === "pagato" || c.stato === "attivo") && c.cliente_id ? (
        <CardContratto titolo="Attivazione" sottotitolo={c.stato === "pagato" ? "Gli accessi li apri tu: quando sono tutti aperti, attiva. I 6 mesi partono da qui." : undefined}>
          <AttivazionePanel
            id={c.id}
            programma={c.programma}
            privato={c.tipo === "privato"}
            attivo={c.stato === "attivo" && c.attivato_il ? { il: c.attivato_il, scadeIl: c.scade_il, recessoFinoAl: c.recesso_fino_al } : null}
          />
        </CardContratto>
      ) : null}

      {compilato ? (
        <CardContratto titolo="Dati del cliente" sottotitolo={firmato ? "Come compaiono nel contratto firmato." : "Inseriti dal cliente, non ancora firmati."}>
          <div className="grid gap-2.5">
            {compilato.map(([label, valore]) => (
              <Riga key={label} label={label}>
                {valore || "—"}
              </Riga>
            ))}
          </div>
        </CardContratto>
      ) : null}

      <ConfermaEliminazione
        open={confermaAnnulla}
        onOpenChange={setConfermaAnnulla}
        titolo="Annullare l'invito?"
        descrizione="Il link smette di funzionare e il cliente non potrà più firmare."
        onConferma={() => annulla.mutate(c.id)}
      />
      <ConfermaEliminazione
        open={confermaElimina}
        onOpenChange={setConfermaElimina}
        titolo="Eliminare definitivamente questo invito?"
        descrizione="Si cancellano l'invito e i dati inseriti dal cliente."
        onConferma={() => elimina.mutate(c.id, { onSuccess: onEliminato })}
      />
    </div>
  );
}
