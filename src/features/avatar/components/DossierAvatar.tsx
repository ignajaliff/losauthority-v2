import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { codiceAvatar, haDossier, type Avatar } from "../types";

interface DossierAvatarProps {
  avatar: Avatar;
  numero: number;
  /** Torna al fronte della carta; assente (vista del team) → niente piè di pagina. */
  onGira?: () => void;
}

export function SezioneDossier({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <section className="grid gap-1.5">
      <h4 className="eyebrow font-sans text-[10px]">{titolo}</h4>
      <div className="text-[14px] leading-snug text-foreground">{children}</div>
    </section>
  );
}

export function ElencoDossier({ voci, corsivo = false }: { voci: string[]; corsivo?: boolean }) {
  if (voci.length === 0) return <p className="text-muted-foreground/60">—</p>;
  return (
    <ul className="grid gap-1 pl-4 list-disc marker:text-muted-foreground/60">
      {voci.map((v) => (
        <li key={v} className={corsivo ? "font-display text-[16px] italic" : ""}>
          {corsivo ? `«${v}»` : v}
        </li>
      ))}
    </ul>
  );
}

export const TestoDossier = ({ v }: { v: string | null }) => (v ? <p className="whitespace-pre-wrap">{v}</p> : <p className="text-muted-foreground/60">—</p>);

/**
 * Il retro della carta: il dossier del cliente ideale, tutto materiale utile
 * al cliente per la sua comunicazione (dolori, credenze, desideri, linguaggio,
 * canali, obiezioni, trigger). La diagnosi per Wesley NON è qui: vive in
 * avatar_diagnosi e la vede solo il team (DiagnosiAvatar).
 */
export function DossierAvatar({ avatar, numero, onGira }: DossierAvatarProps) {
  const pronto = haDossier(avatar);
  return (
    <article aria-label={`Dossier di ${avatar.nome ?? "avatar in compilazione"}`} className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <header className="flex items-center justify-between gap-4 border-b px-5 py-3">
        <h3 className="eyebrow font-sans text-[10px] text-foreground">Dossier · Cliente ideale</h3>
        <p className="figure shrink-0 text-[11px] text-muted-foreground">N. {codiceAvatar(numero)}</p>
      </header>

      {!pronto ? (
        <div className="grid gap-2 px-6 py-14 text-center">
          <p className="font-display text-[22px] italic text-muted-foreground">Il dossier si scrive durante la conversazione.</p>
          <p className="text-sm text-muted-foreground">Dolori, credenze, desideri, linguaggio, canali, obiezioni e trigger compariranno qui man mano.</p>
        </div>
      ) : (
        <div className="grid gap-6 p-5 sm:p-6">
          {avatar.snapshot ? <p className="font-display text-[20px] leading-snug">{avatar.snapshot}</p> : null}
          <div className="grid gap-5 sm:grid-cols-2">
            <SezioneDossier titolo="Chi è">
              <TestoDossier v={[avatar.eta && `${avatar.eta} anni`, avatar.genere, avatar.situazione].filter(Boolean).join(" · ") || null} />
            </SezioneDossier>
            <SezioneDossier titolo="Quando cerca aiuto">
              <TestoDossier v={avatar.momento} />
            </SezioneDossier>
            <SezioneDossier titolo="Contesto di vita">
              <TestoDossier v={avatar.contesto} />
            </SezioneDossier>
            <SezioneDossier titolo="Frase-simbolo">
              {avatar.frase ? <p className="font-display text-[17px] italic">«{avatar.frase}»</p> : <p className="text-muted-foreground/60">—</p>}
            </SezioneDossier>
            <SezioneDossier titolo="Dolori di superficie (li dice)">
              <ElencoDossier voci={avatar.dolori_superficie} />
            </SezioneDossier>
            <SezioneDossier titolo="Dolori profondi (non li confessa)">
              <ElencoDossier voci={avatar.dolori_profondi} />
            </SezioneDossier>
            <SezioneDossier titolo="Credenze limitanti">
              <ElencoDossier voci={avatar.credenze_limitanti ?? []} />
            </SezioneDossier>
            <div className="grid gap-5">
              <SezioneDossier titolo="Desiderio pratico">
                <TestoDossier v={avatar.desiderio_pratico} />
              </SezioneDossier>
              <SezioneDossier titolo="Desiderio emotivo">
                <TestoDossier v={avatar.desiderio_emotivo} />
              </SezioneDossier>
            </div>
          </div>
          <SezioneDossier titolo="Linguaggio · parole sue, letterali">
            <ElencoDossier voci={avatar.linguaggio} corsivo />
          </SezioneDossier>
          <div className="grid gap-5 sm:grid-cols-3">
            <SezioneDossier titolo="Piattaforme">
              <ElencoDossier voci={avatar.piattaforme} />
            </SezioneDossier>
            <SezioneDossier titolo="Chi segue">
              <ElencoDossier voci={avatar.chi_segue} />
            </SezioneDossier>
            <SezioneDossier titolo="Dove cerca soluzioni">
              <TestoDossier v={avatar.dove_cerca} />
            </SezioneDossier>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <SezioneDossier titolo="Obiezioni">
              <ElencoDossier voci={avatar.obiezioni} />
            </SezioneDossier>
            <SezioneDossier titolo="Trigger d'acquisto">
              <ElencoDossier voci={avatar.trigger_acquisto} />
            </SezioneDossier>
          </div>
        </div>
      )}

      {onGira ? (
        <footer className="flex items-center justify-end border-t bg-muted/40 px-5 py-2.5">
          <button type="button" onClick={onGira} className="group inline-flex items-center gap-1 text-[12px] font-medium text-foreground transition-colors hover:text-foreground/70 pointer-coarse:-my-2.5 pointer-coarse:py-2.5">
            <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden />
            Torna alla carta
          </button>
        </footer>
      ) : null}
    </article>
  );
}
