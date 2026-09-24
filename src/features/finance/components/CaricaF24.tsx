import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { useCaricaF24 } from "../hooks/useF24";
import { caricaF24Schema, type CaricaF24Values } from "../schema";

/** Card "Carica un F24": PDF → storage → l'AI legge importi e scadenze (una riga per rata). */
export function CaricaF24() {
  const carica = useCaricaF24();
  const form = useForm<CaricaF24Values>({ resolver: zodResolver(caricaF24Schema) });
  // Un input file non si svuota con form.reset: si rimonta cambiando la key.
  const [versioneInput, setVersioneInput] = useState(0);

  function onSubmit(values: CaricaF24Values) {
    carica.mutate(values.pdf, {
      onSuccess: () => {
        form.reset({ pdf: undefined });
        setVersioneInput((v) => v + 1);
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carica un F24</CardTitle>
        <CardDescription>
          Leggo io importi e scadenze, anche i piani a rate: una riga per rata. Il giorno prima ti arriva il promemoria su
          Telegram.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-3" noValidate>
            <FormField
              control={form.control}
              name="pdf"
              render={({ field: { onChange, name, onBlur, ref } }) => (
                <FormItem className="min-w-64 flex-1">
                  <FormLabel>PDF dell'F24 (max 10 MB)</FormLabel>
                  <FormControl>
                    <Input
                      key={versioneInput}
                      type="file"
                      accept="application/pdf"
                      name={name}
                      ref={ref}
                      onBlur={onBlur}
                      onChange={(e) => onChange(e.target.files?.[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={carica.isPending}>
              <Upload /> {carica.isPending ? "Sto leggendo il PDF…" : "Carica F24"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
