import { EyeOff } from "lucide-react";
import type { DiagnosiAvatar as Diagnosi } from "../types";
import { ElencoDossier, SezioneDossier, TestoDossier } from "./DossierAvatar";

/**
 * La lettura di Aura per Wesley (tabella avatar_diagnosi, RLS solo team):
 * quadro, punti di forza, criticità, quanto è ristretto, come usarlo, da
 * validare in call. Si mostra SOLO nel gestionale, mai nell'area cliente.
 */
export function DiagnosiAvatar({ diagnosi, completo }: { diagnosi: Diagnosi | null; completo: boolean }) {
  return (
    <article aria-label="Diagnosi per Wesley" className="grid gap-5 rounded-lg border border-foreground/30 bg-muted/30 p-5 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="eyebrow font-sans text-[10px] text-foreground">Diagnosi · la lettura di Aura per Wesley</h3>
        <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <EyeOff className="size-3.5" aria-hidden /> Il cliente non la vede
        </p>
      </header>
      {!diagnosi ? (
        <p className="text-sm text-muted-foreground">{completo ? "Nessuna diagnosi salvata per questo avatar." : "Aura la scrive quando la conversazione arriva in fondo."}</p>
      ) : (
        <>
          <SezioneDossier titolo="Quadro">
            <TestoDossier v={diagnosi.quadro} />
          </SezioneDossier>
          <div className="grid gap-5 sm:grid-cols-2">
            <SezioneDossier titolo="Punti di forza">
              <ElencoDossier voci={diagnosi.punti_forza} />
            </SezioneDossier>
            <SezioneDossier titolo="Criticità">
              <ElencoDossier voci={diagnosi.criticita} />
            </SezioneDossier>
          </div>
          <SezioneDossier titolo="Quanto è ristretto">
            <TestoDossier v={diagnosi.quanto_ristretto} />
          </SezioneDossier>
          <SezioneDossier titolo="Come usarlo subito">
            <TestoDossier v={diagnosi.come_usarlo} />
          </SezioneDossier>
          <SezioneDossier titolo="Da validare in call">
            <ElencoDossier voci={diagnosi.da_validare} />
          </SezioneDossier>
        </>
      )}
    </article>
  );
}
