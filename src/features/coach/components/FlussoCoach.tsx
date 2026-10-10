import { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { PensieroAura, scorriChatInFondo } from "@/features/idee";
import { AuraSfera } from "@/shared/components/brand/AuraSfera";
import { Button } from "@/shared/components/ui/button";
import { FASI_COACH, leggiCapitolo, type LezioneCoach, type MessaggioCoach } from "../types";
import { CardLezione } from "./CardLezione";

interface FlussoCoachProps {
  messaggi: MessaggioCoach[];
  lezioni: LezioneCoach[];
  /** Messaggio appena inviato e non ancora arrivato dal server ("" per una riprova). */
  pendente: string | null;
  occupato: boolean;
  onRiprova: (messaggio: MessaggioCoach) => void;
}

function BollaCliente({ testo }: { testo: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-primary-foreground">{testo}</p>
    </div>
  );
}

/** La conversazione con il coach: il cliente a destra, Aura a sinistra con le lezioni consigliate sotto ogni risposta. */
export function FlussoCoach({ messaggi, lezioni, pendente, occupato, onRiprova }: FlussoCoachProps) {
  const fineRef = useRef<HTMLDivElement>(null);
  const ultimoId = messaggi.at(-1)?.id;
  const ultimoStato = messaggi.at(-1)?.stato;

  // Da md scorre solo il contenitore della chat, sul telefono la finestra (vedi scorriChatInFondo).
  useEffect(() => {
    scorriChatInFondo(fineRef.current);
  }, [ultimoId, ultimoStato, lezioni.length, pendente]);

  /** Le lezioni consigliate in una risposta, ciascuna con il capitolo salvato allo stesso indice (se c'è). */
  const lezioniDi = (m: MessaggioCoach) =>
    m.lezioni_ids.flatMap((id, i) => {
      const lezione = lezioni.find((l) => l.id === id);
      return lezione ? [{ lezione, capitolo: leggiCapitolo(m.lezioni_capitoli[i]) }] : [];
    });

  return (
    <div className="grid gap-6">
      {messaggi.map((m) => {
        if (m.ruolo === "cliente") return <BollaCliente key={m.id} testo={m.contenuto} />;
        const consigliate = lezioniDi(m);
        return (
          <div key={m.id} className="grid gap-4">
            {m.stato === "in_corso" ? (
              <PensieroAura fasi={FASI_COACH} />
            ) : (
              <div className="flex items-start gap-3">
                <AuraSfera dimensione={32} conNome={false} className="mt-0.5" />
                <div className="min-w-0 flex-1 pt-1">
                  {m.stato === "completato" && m.contenuto ? (
                    <p className="font-display text-[19px] leading-snug text-foreground whitespace-pre-wrap">{m.contenuto}</p>
                  ) : null}
                  {m.stato === "errore" ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm text-muted-foreground">Il coach non è riuscito a rispondere{m.errore ? ` (${m.errore.toLowerCase()})` : ""}.</p>
                      <Button size="sm" variant="outline" disabled={occupato} onClick={() => onRiprova(m)}>
                        <RotateCcw aria-hidden /> Riprova
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
            {consigliate.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 md:pl-11 xl:grid-cols-3">
                {consigliate.map((c, i) => (
                  <CardLezione key={c.lezione.id} lezione={c.lezione} capitolo={c.capitolo} indice={i} />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}

      {pendente !== null ? (
        <>
          {pendente ? <BollaCliente testo={pendente} /> : null}
          <PensieroAura fasi={FASI_COACH} />
        </>
      ) : null}

      <div ref={fineRef} />
    </div>
  );
}
