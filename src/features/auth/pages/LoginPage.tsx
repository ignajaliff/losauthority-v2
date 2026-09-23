import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { logDev } from "@/shared/utils/errors";
import { useAuth } from "../hooks/useAuth";
import { homePerRuolo } from "../components/ProtectedRoute";
import { loginSchema, type LoginValues } from "../schema";
import type { Rol } from "../types";

export function LoginPage() {
  const { session, utente, caricamento } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [invio, setInvio] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (!caricamento && session && utente) {
    return <Navigate to={homePerRuolo(utente.rol)} replace />;
  }

  async function onSubmit(values: LoginValues) {
    setInvio(true);
    const { data, error } = await supabase.auth.signInWithPassword(values);
    if (error || !data.user) {
      logDev(error);
      toast.error("Email o password non corretti.");
      setInvio(false);
      return;
    }
    const { data: ruolo } = await supabase
      .from("user_roles")
      .select("rol")
      .eq("id", data.user.id)
      .maybeSingle();
    const rol = (ruolo?.rol as Rol | undefined) ?? "cliente";
    const from = (location.state as { from?: string } | null)?.from;
    const dest = from && from.startsWith("/") && !from.startsWith("//") ? from : homePerRuolo(rol);
    navigate(dest, { replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Accedi</CardTitle>
          <CardDescription>Gestionale e area cliente Los Authority</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" placeholder="nome@esempio.it" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={invio}>
                {invio ? "Accesso in corso…" : "Entra"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}

export default LoginPage;
