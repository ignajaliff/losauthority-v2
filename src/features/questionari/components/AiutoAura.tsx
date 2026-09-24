import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useAuraHelp, type EsitoAura } from "../hooks/useAuraHelp";
import type { QuestionarioId } from "../types";

interface AiutoAuraProps {
  questionarioId: QuestionarioId;
  domandaId: string;
}

const DOMANDA_RAPIDA = "Puoi spiegarmi meglio questa domanda e farmi un esempio?";

/** Pulsante "Chiedi ad Aura" per una singola domanda: risposta in un Popover. */
export function AiutoAura({ questionarioId, domandaId }: AiutoAuraProps) {
  const [testo, setTesto] = useState("");
  const [esito, setEsito] = useState<EsitoAura | null>(null);
  const aura = useAuraHelp();

  function chiedi(domanda: string) {
    const pulita = domanda.trim();
    if (!pulita || aura.isPending) return;
    setEsito(null);
    aura.mutate({ domanda: pulita, questionario_id: questionarioId, domanda_id: domandaId }, { onSuccess: setEsito });
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button type="button" variant="ghost" size="xs" aria-label="Chiedi ad Aura un aiuto su questa domanda" />
        }
      >
        <Sparkles aria-hidden />
        Chiedi ad Aura
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Aura</PopoverTitle>
          <PopoverDescription>Un dubbio su questa domanda? Chiedi pure.</PopoverDescription>
        </PopoverHeader>
        <Textarea
          aria-label="La tua domanda per Aura"
          rows={2}
          placeholder="Es. Cosa intendi per…?"
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={aura.isPending || testo.trim() === ""} onClick={() => chiedi(testo)}>
            {aura.isPending ? "Aura sta pensando…" : "Chiedi"}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={aura.isPending} onClick={() => chiedi(DOMANDA_RAPIDA)}>
            Spiegamela
          </Button>
        </div>
        {esito ? (
          esito.ok ? (
            <p className="whitespace-pre-wrap text-sm">{esito.risposta}</p>
          ) : (
            <p role="alert" className="text-sm text-destructive">
              {esito.error}
            </p>
          )
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
