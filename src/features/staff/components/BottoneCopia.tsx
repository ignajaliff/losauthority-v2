import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { logDev } from "@/shared/utils/errors";

interface BottoneCopiaProps {
  testo: string;
  etichetta?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
}

/** Copia un testo negli appunti con conferma visiva. */
export function BottoneCopia({ testo, etichetta = "Copia", variant = "outline" }: BottoneCopiaProps) {
  const [copiato, setCopiato] = useState(false);

  async function handleCopia() {
    try {
      await navigator.clipboard.writeText(testo);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2000);
    } catch (error) {
      logDev(error);
      toast.error("Copia non riuscita", { description: "Seleziona il testo e copialo a mano." });
    }
  }

  return (
    <Button type="button" size="sm" variant={variant} onClick={() => void handleCopia()}>
      {copiato ? <Check aria-hidden /> : <Copy aria-hidden />}
      {copiato ? "Copiato" : etichetta}
    </Button>
  );
}
