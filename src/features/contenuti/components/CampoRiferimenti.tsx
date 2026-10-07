import { useFieldArray, type Control } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { MAX_RIFERIMENTI, type ContenutoFormValues } from "../schema";

/** Lista di link di riferimento: un input per link, aggiungi/rimuovi. */
export function CampoRiferimenti({ control }: { control: Control<ContenutoFormValues> }) {
  const { fields, append, remove } = useFieldArray({ control, name: "riferimenti" });

  return (
    <fieldset className="grid gap-2">
      <div className="flex items-center justify-between">
        <legend className="text-sm font-medium">Riferimenti</legend>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={fields.length >= MAX_RIFERIMENTI}
          onClick={() => append({ url: "" })}
        >
          <Plus aria-hidden /> Aggiungi link
        </Button>
      </div>
      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">Video o post da cui prendere spunto, un link per riga.</p>
      ) : null}
      {fields.map((f, i) => (
        <FormField
          key={f.id}
          control={control}
          name={`riferimenti.${i}.url`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Riferimento {i + 1}</FormLabel>
              <div className="flex items-start gap-2">
                <FormControl>
                  <Input inputMode="url" placeholder="https://…" autoFocus={i === fields.length - 1 && field.value === ""} {...field} />
                </FormControl>
                <Button type="button" size="icon" variant="ghost" aria-label={`Rimuovi riferimento ${i + 1}`} onClick={() => remove(i)}>
                  <X aria-hidden />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </fieldset>
  );
}
