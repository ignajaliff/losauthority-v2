import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { Tag } from "../types";

interface TagPickerProps {
  tags: Tag[];
  selezionati: string[];
  onChange: (ids: string[]) => void;
  nuovoTag: string;
  onNuovoTagChange: (v: string) => void;
  disabled?: boolean;
}

/** Caselle per i tag esistenti + un campo per crearne uno nuovo al volo. */
export function TagPicker({ tags, selezionati, onChange, nuovoTag, onNuovoTagChange, disabled }: TagPickerProps) {
  const toggle = (id: string, on: boolean) => {
    onChange(on ? [...new Set([...selezionati, id])] : selezionati.filter((x) => x !== id));
  };
  return (
    <div className="grid gap-3">
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Label key={t.id} className="cursor-pointer rounded-4xl border px-3 py-1.5 font-normal">
              <Checkbox
                checked={selezionati.includes(t.id)}
                onCheckedChange={(on) => toggle(t.id, on)}
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
