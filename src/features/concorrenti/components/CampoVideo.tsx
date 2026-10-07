import { useFieldArray, type Control } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import type { ConcorrenteFormValues } from "../schema";
import { MAX_VIDEO } from "../types";

/** I video della referenza: per ognuno il link e la descrizione di cosa c'è dentro. */
export function CampoVideo({ control }: { control: Control<ConcorrenteFormValues> }) {
  const { fields, append, remove } = useFieldArray({ control, name: "video" });

  return (
    <fieldset className="grid gap-3">
      <div className="flex items-center justify-between">
        <legend className="text-sm font-medium">Video</legend>
        <Button type="button" size="sm" variant="ghost" disabled={fields.length >= MAX_VIDEO} onClick={() => append({ url: "", descrizione: "" })}>
          <Plus aria-hidden /> Aggiungi video
        </Button>
      </div>
      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Incolla i video che ti servono da esempio e scrivi cosa c'è dentro: il tema, l'aggancio, perché funziona.
        </p>
      ) : null}
      {fields.map((f, i) => (
        <div key={f.id} className="grid gap-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Video {i + 1}</span>
            <Button type="button" size="icon-sm" variant="ghost" aria-label={`Togli il video ${i + 1}`} onClick={() => remove(i)}>
              <Trash2 aria-hidden />
            </Button>
          </div>
          <FormField
            control={control}
            name={`video.${i}.url`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Link del video {i + 1}</FormLabel>
                <FormControl>
                  <Input inputMode="url" placeholder="Link del video, es. instagram.com/reel/…" autoFocus={field.value === ""} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`video.${i}.descrizione`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Descrizione del video {i + 1}</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="Cosa c'è nel video e cosa ti colpisce" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
    </fieldset>
  );
}
