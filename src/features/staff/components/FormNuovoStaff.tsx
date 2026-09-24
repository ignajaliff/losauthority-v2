import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { nuovoStaffSchema, type NuovoStaffValues } from "../schema";
import { RUOLI_STAFF } from "../types";

interface FormNuovoStaffProps {
  invio: boolean;
  onInvia: (values: NuovoStaffValues) => void;
}

const ETICHETTE_RUOLI: Record<string, string> = Object.fromEntries(
  RUOLI_STAFF.map((r) => [r.valore, r.etichetta]),
);

/** Form di creazione collaboratore: nome, email, permessi, password facoltativa. */
export function FormNuovoStaff({ invio, onInvia }: FormNuovoStaffProps) {
  const form = useForm<NuovoStaffValues>({
    resolver: zodResolver(nuovoStaffSchema),
    defaultValues: { nombre: "", email: "", rol: "staff", password: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onInvia)} className="grid gap-4" noValidate>
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome collaboratore</FormLabel>
              <FormControl>
                <Input placeholder="Es. Luca Bianchi" autoComplete="off" {...field} />
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
                <Input type="email" placeholder="collaboratore@email.it" autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permessi</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  items={ETICHETTE_RUOLI}
                  onValueChange={(v) => v && field.onChange(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RUOLI_STAFF.map((r) => (
                      <SelectItem key={r.valore} value={r.valore}>
                        {r.etichetta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                {RUOLI_STAFF.find((r) => r.valore === field.value)?.descrizione}
              </FormDescription>
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
                <Input type="text" placeholder="Lascia vuoto per generarla" autoComplete="off" {...field} />
              </FormControl>
              <FormDescription>Minimo 8 caratteri. Se vuota, viene generata e mostrata una sola volta.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={invio}>
          {invio ? "Creazione…" : "Crea staff"}
        </Button>
      </form>
    </Form>
  );
}
