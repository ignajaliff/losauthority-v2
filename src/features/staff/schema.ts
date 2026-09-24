import { z } from "zod";

export const nuovoStaffSchema = z.object({
  nombre: z.string().trim().min(1, "Inserisci il nome del collaboratore").max(120, "Massimo 120 caratteri"),
  email: z.string().trim().toLowerCase().email("Inserisci un'email valida"),
  rol: z.enum(["staff", "staff_fatture"], { message: "Scegli i permessi" }),
  // Facoltativa: vuota → la genera la Edge Function.
  password: z
    .string()
    .trim()
    .refine((v) => v.length === 0 || v.length >= 8, "Almeno 8 caratteri (o lascia vuoto per generarla)"),
});

export type NuovoStaffValues = z.infer<typeof nuovoStaffSchema>;
