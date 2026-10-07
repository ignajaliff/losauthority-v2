import { EyeOff } from "lucide-react";
import { ElencoDossier, SezioneDossier, TestoDossier } from "@/features/avatar";
import type { DiagnosiOfferta as Diagnosi } from "../types";

/**
 * La lettura di Aura per Wesley (tabella offerta_diagnosi, RLS solo team):
 * quadro, equazione del valore, credibilità ed erogabilità, nodo centrale,
 * priorità operativa, da validare in call. Si mostra SOLO nel gestionale.
 */
export function DiagnosiOfferta({ diagnosi, completa }: { diagnosi: Diagnosi | null; completa: boolean }) {
  return (
    <article aria-label="Diagnosi per Wesley" className="grid gap-5 rounded-lg border border-foreground/30 bg-muted/30 p-5 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="eyebrow font-sans text-[10px] text-foreground">Diagnosi · la lettura di Aura per Wesley</h3>
        <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <EyeOff className="size-3.5" aria-hidden /> Il cliente non la vede
        </p>
      </header>
      {!diagnosi ? (
        <p className="text-sm text-muted-foreground">{completa ? "Nessuna diagnosi salvata per questa offerta." : "Aura la scrive quando la conversazione arriva in fondo."}</p>
      ) : (
        <>
          <SezioneDossier titolo="Quadro">
            <TestoDossier v={diagnosi.quadro} />
          </SezioneDossier>
          <div className="grid gap-5 sm:grid-cols-2">
            <SezioneDossier titolo="Equazione del valore · la leva scoperta">
              <TestoDossier v={diagnosi.equazione_valore} />
            </SezioneDossier>
            <SezioneDossier titolo="Credibilità ed erogabilità">
              <TestoDossier v={diagnosi.credibilita_erogabilita} />
            </SezioneDossier>
          </div>
          <SezioneDossier titolo="Il nodo centrale">
            <TestoDossier v={diagnosi.nodo_centrale} />
          </SezioneDossier>
          <SezioneDossier titolo="Priorità operativa">
            <TestoDossier v={diagnosi.priorita_operativa} />
          </SezioneDossier>
          <SezioneDossier titolo="Da validare in call">
            <ElencoDossier voci={diagnosi.da_validare} />
          </SezioneDossier>
        </>
      )}
    </article>
  );
}
