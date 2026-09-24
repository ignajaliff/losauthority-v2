import type { MouseEvent } from "react";
import { Instagram, Music2, Notebook, Phone } from "lucide-react";
import { buttonVariants } from "@/shared/components/ui/button";

interface LinkRapidiProps {
  notionHubUrl?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  telefono?: string | null;
}

/** Evita che il click sull'icona faccia anche navigare la riga della tabella. */
const ferma = (e: MouseEvent) => e.stopPropagation();
const classe = buttonVariants({ variant: "outline", size: "icon-sm" });

/** Icone rapide: hub Notion · Instagram · TikTok · telefono. */
export function LinkRapidi({ notionHubUrl, instagram, tiktok, telefono }: LinkRapidiProps) {
  if (!notionHubUrl && !instagram && !tiktok && !telefono) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1" onClick={ferma}>
      {notionHubUrl ? (
        <a href={notionHubUrl} target="_blank" rel="noreferrer" className={classe} title="Apri l'hub su Notion" aria-label="Hub Notion">
          <Notebook aria-hidden />
        </a>
      ) : null}
      {instagram ? (
        <a href={instagram} target="_blank" rel="noreferrer" className={classe} title="Instagram" aria-label="Instagram">
          <Instagram aria-hidden />
        </a>
      ) : null}
      {tiktok ? (
        <a href={tiktok} target="_blank" rel="noreferrer" className={classe} title="TikTok" aria-label="TikTok">
          <Music2 aria-hidden />
        </a>
      ) : null}
      {telefono ? (
        <a href={`tel:${telefono.replace(/\s+/g, "")}`} className={classe} title={telefono} aria-label={`Chiama ${telefono}`}>
          <Phone aria-hidden />
        </a>
      ) : null}
    </span>
  );
}
