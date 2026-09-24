import { Badge } from "@/shared/components/ui/badge";
import { etichettaFase, etichettaStatoOnboarding, varianteFase, varianteStatoOnboarding } from "../fasi";

export function BadgeFase({ fase, breve = false }: { fase: string | null | undefined; breve?: boolean }) {
  return <Badge variant={varianteFase(fase)}>{etichettaFase(fase, breve)}</Badge>;
}

export function BadgeStatoOnboarding({ stato }: { stato: string | null | undefined }) {
  return <Badge variant={varianteStatoOnboarding(stato)}>{etichettaStatoOnboarding(stato)}</Badge>;
}

/** Tag del cliente come badge piccoli. */
export function BadgeTag({ labels }: { labels: string[] | null | undefined }) {
  if (!labels || labels.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {labels.map((t) => (
        <Badge key={t} variant="outline" className="h-4 px-1.5 text-[10px]">
          {t}
        </Badge>
      ))}
    </span>
  );
}
