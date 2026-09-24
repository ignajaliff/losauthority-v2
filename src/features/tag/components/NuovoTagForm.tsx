import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { useCreaTag } from "../hooks/useTag";
import { tagSchema, type TagFormValues } from "../schema";

/** Card "Aggiungi tag": un solo campo, label 1–60 caratteri. */
export function NuovoTagForm() {
  const crea = useCreaTag();
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: { label: "" },
  });

  function onSubmit({ label }: TagFormValues) {
    crea.mutate(label, { onSuccess: () => form.reset({ label: "" }) });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aggiungi tag</CardTitle>
        <CardDescription>I tag riutilizzabili da assegnare ai clienti (es. il servizio venduto).</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2" noValidate>
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="sr-only">Nuovo tag</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. Los Authority VIP" maxLength={60} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={crea.isPending}>
              <Plus aria-hidden />
              {crea.isPending ? "Aggiungo…" : "Aggiungi"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
