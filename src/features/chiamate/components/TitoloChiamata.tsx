import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/shared/components/ui/form";
import { titoloChiamataSchema, type TitoloChiamataValues } from "../schema";
import { useAggiornaTitoloChiamata } from "../hooks/useChiamate";
import type { Chiamata } from "../types";

const TITOLO_DI_DEFAULT = "Call registrata";

/** Titolo della call, modificabile al volo (matita → input → salva/annulla). */
export function TitoloChiamata({ chiamata, modificabile }: { chiamata: Chiamata; modificabile: boolean }) {
  const [inModifica, setInModifica] = useState(false);
  const aggiorna = useAggiornaTitoloChiamata();

  const form = useForm<TitoloChiamataValues>({
    resolver: zodResolver(titoloChiamataSchema),
    defaultValues: { titolo: chiamata.titolo ?? "" },
  });

  function apri() {
    form.reset({ titolo: chiamata.titolo ?? "" });
    setInModifica(true);
  }

  function onSubmit(values: TitoloChiamataValues) {
    if (values.titolo === (chiamata.titolo ?? "")) {
      setInModifica(false);
      return;
    }
    aggiorna.mutate(
      { id: chiamata.id, clienteId: chiamata.cliente_id, titolo: values.titolo },
      { onSuccess: () => setInModifica(false) },
    );
  }

  if (!inModifica) {
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        <h3 className="min-w-0 truncate font-heading text-base font-medium">
          {chiamata.titolo || TITOLO_DI_DEFAULT}
        </h3>
        {modificabile && (
          <Button type="button" variant="ghost" size="icon-xs" className="pointer-coarse:size-9" aria-label="Modifica titolo" onClick={apri}>
            <Pencil />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-wrap items-start gap-2"
        noValidate
        onKeyDown={(e) => {
          if (e.key === "Escape") setInModifica(false);
        }}
      >
        <FormField
          control={form.control}
          name="titolo"
          render={({ field }) => (
            <FormItem className="min-w-48 flex-1">
              <FormControl>
                <Input {...field} autoFocus placeholder="Titolo della call" aria-label="Titolo della call" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm" disabled={aggiorna.isPending} aria-label="Salva titolo">
          <Check /> Salva
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setInModifica(false)}
          aria-label="Annulla modifica"
        >
          <X /> Annulla
        </Button>
      </form>
    </Form>
  );
}
