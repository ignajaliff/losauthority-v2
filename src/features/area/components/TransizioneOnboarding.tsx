import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuraSfera } from "@/shared/components/brand/AuraSfera";

/** Quanto resta a schermo prima di aprire lo spazio cliente. */
const DURATA_MS = 3400;

/**
 * Schermata piena che segue l'invio della scheda: Aura "parla", il messaggio
 * sale in dissolvenza, poi si apre /area/dashboard. Rispetta prefers-reduced-motion.
 */
export function TransizioneOnboarding() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => navigate("/area/dashboard", { replace: true }), DURATA_MS);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background px-6 text-center animate-in fade-in duration-700 motion-reduce:animate-none"
    >
      <AuraSfera dimensione={128} parla conNome={false} />
      <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-700 delay-500 motion-reduce:animate-none">
        <p className="eyebrow">Scheda inviata</p>
        <h2 className="font-display text-[clamp(28px,4vw,38px)] leading-tight font-normal tracking-[-0.01em] italic">
          Ottimo lavoro.
        </h2>
        <p className="mx-auto max-w-[420px] text-[15px] leading-relaxed text-muted-foreground">
          Sto preparando il tuo spazio di lavoro. Da qui seguirai il percorso insieme a Wesley e al suo team.
        </p>
      </div>
    </div>
  );
}
