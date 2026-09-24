import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { FASI, STATI_ONBOARDING } from "../fasi";
import { useAggiornaCliente, useCreaHub } from "../hooks/useAggiornaCliente";
import { statoClienteSchema, type StatoClienteValues } from "../schema";
import type { ClienteDettaglio } from "../types";

const VOCI_FASE = FASI.map((f) => ({ value: f.value, label: f.label }));
const VOCI_STATO = STATI_ONBOARDING.map((s) => ({ value: s.value, label: s.label }));

/** Fase, stato onboarding e hub Notion (con "Crea hub adesso"). */
export function FormStatoCliente({ cliente }: { cliente: ClienteDettaglio }) {
  const aggiorna = useAggiornaCliente(cliente.id, "Stato salvato");
  const creaHub = useCreaHub(cliente.id);
  const form = useForm<StatoClienteValues>({
    resolver: zodResolver(statoClienteSchema),
    defaultValues: {
      fase: cliente.fase,
      stato_onboarding: cliente.stato_onboarding,
      notion_hub_url: cliente.notion_hub_url ?? "",
    },
  });
  const puoCreareHub = cliente.stato_onboarding === "completato" && !cliente.notion_hub_url;

  function onSubmit(v: StatoClienteValues) {
    aggiorna.mutate({ fase: v.fase, stato_onboarding: v.stato_onboarding, notion_hub_url: v.notion_hub_url || null });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stato del percorso</CardTitle>
        <CardDescription>Fase, lavorazione dell'onboarding e hub Notion.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="fase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fase</FormLabel>
                  <Select items={VOCI_FASE} value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Scegli la fase" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VOCI_FASE.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>La fase avanza da sola con i compiti Notion; qui la forzi a mano.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stato_onboarding"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stato onboarding</FormLabel>
                  <Select items={VOCI_STATO} value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Scegli lo stato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VOCI_STATO.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>«Fuori target» si imposta solo a mano.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notion_hub_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link hub Notion</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://www.notion.so/…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" size="sm" disabled={aggiorna.isPending}>
                {aggiorna.isPending ? "Salvo…" : "Salva stato"}
              </Button>
              {puoCreareHub ? (
                <Button type="button" size="sm" variant="secondary" onClick={() => creaHub.mutate()} disabled={creaHub.isPending}>
                  <Sparkles aria-hidden />
                  {creaHub.isPending ? "Aura sta creando l'hub…" : "Crea hub adesso"}
                </Button>
              ) : null}
              {creaHub.isPending ? <span className="text-xs text-muted-foreground">Scrive i 5 documenti: circa un minuto.</span> : null}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
