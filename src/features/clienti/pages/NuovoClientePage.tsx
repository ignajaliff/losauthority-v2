import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ErroreCaricamento, SkeletonRighe } from "@/shared/components/layout/StatoCaricamento";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { CredenzialiCard } from "../components/CredenzialiCard";
import { TagPicker } from "../components/TagPicker";
import { useCreaCliente } from "../hooks/useAccountCliente";
import { useCreaTag, useTags } from "../hooks/useTags";
import { nuovoClienteSchema, type NuovoClienteValues } from "../schema";
import type { CredenzialiCliente } from "../types";

const DEFAULTS: NuovoClienteValues = { nombre: "", email: "", password: "", telefono: "", tag_ids: [], nuovo_tag: "" };

export default function NuovoClientePage() {
  const { data: tags, isLoading, isError } = useTags();
  const creaTag = useCreaTag();
  const crea = useCreaCliente();
  const [credenziali, setCredenziali] = useState<CredenzialiCliente | null>(null);
  const form = useForm<NuovoClienteValues>({ resolver: zodResolver(nuovoClienteSchema), defaultValues: DEFAULTS });
  const nuovoTag = useWatch({ control: form.control, name: "nuovo_tag" });
  const occupato = creaTag.isPending || crea.isPending;

  async function onSubmit(v: NuovoClienteValues) {
    let tagIds = v.tag_ids;
    if (v.nuovo_tag) {
      // Il tag nuovo va inserito in `tags` prima di passarne l'id alla Edge Function.
      const creato = await creaTag.mutateAsync(v.nuovo_tag).catch(() => null);
      if (!creato) return;
      tagIds = [...new Set([...tagIds, creato.id])];
    }
    const r = await crea
      .mutateAsync({ nombre: v.nombre, email: v.email.toLowerCase(), password: v.password, telefono: v.telefono, tag_ids: tagIds })
      .catch(() => null);
    if (r) setCredenziali(r);
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/clienti" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Clienti
      </Link>
      <PageHeader titolo="Nuovo cliente" sottotitolo="Crei l'account: il cliente riceverà email e password per accedere e completare l'onboarding." />

      {credenziali ? (
        <CredenzialiCard
          credenziali={credenziali}
          onCreaAltro={() => {
            setCredenziali(null);
            form.reset(DEFAULTS);
          }}
        />
      ) : (
        <Card>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Maria Rossi" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="cliente@email.it" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password (facoltativa)</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Lascia vuoto per generarla" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormDescription>Minimo 8 caratteri. Se vuota la genera il server.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono (facoltativo)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+39 333 1234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tag_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag (facoltativi)</FormLabel>
                      {isLoading ? <SkeletonRighe righe={1} /> : null}
                      {isError ? <ErroreCaricamento /> : null}
                      {tags ? (
                        <TagPicker
                          tags={tags}
                          selezionati={field.value}
                          onChange={field.onChange}
                          nuovoTag={nuovoTag}
                          onNuovoTagChange={(v) => form.setValue("nuovo_tag", v)}
                          disabled={occupato}
                        />
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={occupato}>
                  {occupato ? "Creazione…" : "Crea cliente"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
