import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { codiceAvatar, ETICHETTA_ORIGINE, rigaMrz, type Avatar } from "../types";

interface CartaAvatarProps {
  avatar: Avatar;
  numero: number;
  /** "Nome del cliente · settore": chi possiede l'avatar. */
  titolare: string;
  /** Aura sta ancora compilando: i campi vuoti pulsano piano. */
  inCompilazione: boolean;
  /** Gira la carta verso il dossier; assente (vista del team) → resta solo la riga MRZ. */
  onGira?: () => void;
  dossierPronto?: boolean;
}

/** Un campo della carta: etichetta piccola e valore; vuoto = trattino (che pulsa mentre Aura compila). */
function Campo({ etichetta, valore, inCompilazione, className }: { etichetta: string; valore: string | null | undefined; inCompilazione: boolean; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="eyebrow text-[10px]">{etichetta}</p>
      {valore ? (
        // Al massimo tre righe: la carta resta compatta, il testo intero è nel dossier (e nel title).
        <p
          key={valore}
          title={valore}
          className="mt-0.5 line-clamp-3 text-[15px] leading-snug text-foreground animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-500"
        >
          {valore}
        </p>
      ) : (
        <p className={cn("mt-0.5 text-[15px] leading-snug text-muted-foreground/50", inCompilazione && "animate-pulse")}>
          <span aria-hidden>—</span>
          <span className="sr-only">Non ancora compilato</span>
        </p>
      )}
    </div>
  );
}

/**
 * La carta d'identità del cliente ideale: foto (l'iniziale in serif), nome
 * grande, i dati essenziali in due colonne, la frase-simbolo e, in fondo, la
 * riga "leggibile dalla macchina" come su un passaporto. Si compila da sola
 * mentre il cliente parla con Aura.
 */
export function CartaAvatar({ avatar, numero, titolare, inCompilazione, onGira, dossierPronto = false }: CartaAvatarProps) {
  const iniziale = avatar.nome?.trim().charAt(0).toUpperCase() ?? "";
  return (
    <article aria-label={`Carta d'identità di ${avatar.nome ?? "avatar in compilazione"}`} className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <header className="flex items-center justify-between gap-4 border-b px-5 py-3">
        <p className="eyebrow text-[10px] text-foreground">Carta d'identità · Cliente ideale</p>
        <p className="figure text-[11px] text-muted-foreground">N. {codiceAvatar(numero)}</p>
      </header>

      {/* La colonna "foto" ha larghezza fissa anche sul telefono: senza, aspect-[3/4] la farebbe alta quanto tutta la carta. */}
      <div className="grid grid-cols-[minmax(0,104px)_1fr] gap-4 p-5 sm:grid-cols-[minmax(0,150px)_1fr] sm:gap-6 sm:p-6">
        <div className="grid aspect-[3/4] place-items-center self-start rounded-md border bg-muted/40" aria-hidden>
          {iniziale ? (
            <span key={iniziale} className="font-display text-[68px] leading-none font-medium animate-in fade-in zoom-in-95 fill-mode-both duration-500 sm:text-[104px]">
              {iniziale}
            </span>
          ) : (
            <span className={cn("font-display text-[52px] leading-none text-muted-foreground/40 sm:text-[72px]", inCompilazione && "animate-pulse")}>?</span>
          )}
        </div>

        <div className="grid min-w-0 content-start gap-5">
          <div>
            <p className="eyebrow text-[10px]">Nome</p>
            {avatar.nome ? (
              <h3 key={avatar.nome} className="text-[44px] leading-[1.05] animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-500">
                {avatar.nome}
              </h3>
            ) : (
              <p className={cn("font-display text-[30px] leading-tight text-muted-foreground/50", inCompilazione && "animate-pulse")}>In compilazione…</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etichetta="Età" valore={avatar.eta} inCompilazione={inCompilazione} />
            <Campo etichetta="Genere" valore={avatar.genere} inCompilazione={inCompilazione} />
            <Campo etichetta="Situazione" valore={avatar.situazione} inCompilazione={inCompilazione} />
            <Campo etichetta="Momento" valore={avatar.momento} inCompilazione={inCompilazione} />
            <Campo etichetta="Origine" valore={avatar.origine ? ETICHETTA_ORIGINE[avatar.origine] : null} inCompilazione={inCompilazione} />
            <Campo etichetta="Titolare" valore={titolare} inCompilazione={false} />
          </div>
          {avatar.frase ? (
            <p key={avatar.frase} className="mt-2 font-display text-[21px] leading-snug italic text-foreground/85 animate-in fade-in fill-mode-both duration-700">
              «{avatar.frase}»
            </p>
          ) : (
            <p className={cn("mt-2 font-display text-[19px] italic text-muted-foreground/40", inCompilazione && "animate-pulse")}>«…»</p>
          )}
        </div>
      </div>

      <footer className="flex items-center justify-between gap-4 border-t bg-muted/40 px-5 py-2.5">
        <p className="figure min-w-0 truncate text-[11px] tracking-[0.14em] text-muted-foreground" aria-hidden>
          {rigaMrz(avatar)}
        </p>
        {onGira ? (
          <button
            type="button"
            onClick={onGira}
            className="group inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-foreground transition-colors hover:text-foreground/70"
          >
            {dossierPronto ? "Gira per il dossier" : "Gira la carta"}
            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
          </button>
        ) : null}
      </footer>
    </article>
  );
}
