import { Instagram, Music2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { ETICHETTA_PIATTAFORMA, type Piattaforma } from "../types";

/** Icona della piattaforma (lucide non ha TikTok: usiamo la nota musicale). */
export function IconaPiattaforma({ piattaforma, className }: { piattaforma: Piattaforma; className?: string }) {
  const Icon = piattaforma === "tiktok" ? Music2 : Instagram;
  return <Icon className={className ?? "size-3.5"} aria-hidden />;
}

/** Badge "TikTok" / "Instagram" con icona. */
export function BadgePiattaforma({ piattaforma }: { piattaforma: Piattaforma }) {
  return (
    <Badge variant="outline" className="gap-1">
      <IconaPiattaforma piattaforma={piattaforma} className="size-3" />
      {ETICHETTA_PIATTAFORMA[piattaforma]}
    </Badge>
  );
}
