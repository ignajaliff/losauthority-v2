import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Inserisci un'email valida"),
  password: z.string().min(6, "Almeno 6 caratteri"),
});

export type LoginValues = z.infer<typeof loginSchema>;
