import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";

interface CopiaButtonProps {
  testo: string;
  etichetta?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
}

/** Copia negli appunti con conferma visiva. */
export function CopiaButton({ testo, etichetta = "Copia", variant = "outline" }: CopiaButtonProps) {
  const [fatto, setFatto] = useState(false);
  async function copia() {
    try {
      await navigator.clipboard.writeText(testo);
      setFatto(true);
      setTimeout(() => setFatto(false), 1500);
    } catch {
      toast.error("Copia non riuscita", { description: "Seleziona il testo e copialo a mano." });
    }
  }
  return (
    <Button type="button" size="sm" variant={variant} onClick={() => void copia()} aria-label={etichetta}>
      {fatto ? <Check aria-hidden /> : <Copy aria-hidden />}
      {fatto ? "Copiato" : etichetta}
    </Button>
  );
}
