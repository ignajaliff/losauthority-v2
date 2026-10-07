import { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { PensieroAura } from "@/features/idee";
import { AuraSfera } from "@/shared/components/brand/AuraSfera";
import { Button } from "@/shared/components/ui/button";
import { FASI_AVATAR } from "../types";

/** Il minimo che serve a disegnare un messaggio: vale per avatar_messaggi e offerta_messaggi. */
export interface MessaggioChat {
  id: string;
  ruolo: string;
  stato: string;
  contenuto: string;
  errore: string | null;
}

interface FlussoAvatarProps<M extends MessaggioChat> {
  messaggi: M[];
  /** Messaggio appena inviato e non ancora arrivato dal server ("" per una riprova). */
  pendente: string | null;
  occupato: boolean;
  onRiprova: (messaggio: M) => void;
  /** Frasi di stato mentre Aura scrive (default: quelle dell'avatar; l'offerta passa le sue). */
  fasi?: readonly string[];
}

function BollaCliente({ testo }: { testo: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-primary-foreground">{testo}</p>
    </div>
  );
}

/** La conversazione che compila l'avatar (o l'offerta): il cliente a destra, Aura a sinistra con la sfera. */
export function FlussoAvatar<M extends MessaggioChat>({ messaggi, pendente, occupato, onRiprova, fasi = FASI_AVATAR }: FlussoAvatarProps<M>) {
  const fineRef = useRef<HTMLDivElement>(null);
  const ultimoId = messaggi.at(-1)?.id;
  const ultimoStato = messaggi.at(-1)?.stato;

  // Scorre solo il contenitore della chat (Safari: scrollIntoView trascina anche gli antenati).
  useEffect(() => {
    const contenitore = fineRef.current?.closest<HTMLElement>("[data-chat-scroll]");
    if (contenitore) contenitore.scrollTo({ top: contenitore.scrollHeight, behavior: "smooth" });
  }, [ultimoId, ultimoStato, pendente]);

  return (
    <div className="grid gap-5">
      {messaggi.map((m) => {
        if (m.ruolo === "cliente") return <BollaCliente key={m.id} testo={m.contenuto} />;
        if (m.stato === "in_corso") return <PensieroAura key={m.id} fasi={fasi} />;
        return (
          <div key={m.id} className="flex items-start gap-3">
            <AuraSfera dimensione={30} conNome={false} className="mt-0.5" />
            <div className="min-w-0 flex-1 pt-1">
              {m.stato === "completato" && m.contenuto ? <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground">{m.contenuto}</p> : null}
              {m.stato === "errore" ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-muted-foreground">Aura non è riuscita a rispondere{m.errore ? ` (${m.errore.toLowerCase()})` : ""}.</p>
                  <Button size="sm" variant="outline" disabled={occupato} onClick={() => onRiprova(m)}>
                    <RotateCcw aria-hidden /> Riprova
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      {pendente !== null ? (
        <>
          {pendente ? <BollaCliente testo={pendente} /> : null}
          <PensieroAura fasi={fasi} />
        </>
      ) : null}

      <div ref={fineRef} />
    </div>
  );
}
