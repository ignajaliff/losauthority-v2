import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { Tag } from "@/features/tag";

interface TagPickerProps {
  /** Catalogo (tabella `tags`). */
  tags: Tag[];
  /** Label selezionate: è ciò che si salva in `clienti.tags`. */
  selezionati: string[];
  onChange: (labels: string[]) => void;
  nuovoTag: string;
  onNuovoTagChange: (v: string) => void;
  disabled?: boolean;
}

/** Caselle per i tag del catalogo + un campo per crearne uno nuovo al volo. */
export function TagPicker({ tags, selezionati, onChange, nuovoTag, onNuovoTagChange, disabled }: TagPickerProps) {
  const toggle = (label: string, on: boolean) => {
    onChange(on ? [...new Set([...selezionati, label])] : selezionati.filter((x) => x !== label));
  };
  return (
    <div className="grid gap-3">
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Label key={t.id} className="cursor-pointer rounded-4xl border px-3 py-1.5 font-normal">
              <Checkbox
                checked={selezionati.includes(t.label)}
                onCheckedChange={(on) => toggle(t.label, on)}
                disabled={disabled}
                aria-label={t.label}
              />
              {t.label}
            </Label>
          ))}
        </div>
      ) : null}
      <Input
        value={nuovoTag}
        onChange={(e) => onNuovoTagChange(e.target.value)}
        disabled={disabled}
        aria-label="Nuovo tag"
        placeholder={tags.length ? "…oppure aggiungi un nuovo tag" : "Aggiungi un tag (es. Los Authority VIP)"}
      />
    </div>
  );
}
