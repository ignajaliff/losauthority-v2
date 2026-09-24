import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { MarmoLogo } from "@/shared/components/brand/MarmoLogo";
import { logDev } from "@/shared/utils/errors";
import { useAuth } from "../hooks/useAuth";
import { homePerRuolo } from "../components/ProtectedRoute";
import { loginSchema, type LoginValues } from "../schema";
import type { Rol } from "../types";

const SITO_PUBBLICO = "https://wesleycaicedo.com";

/** Pannello sinistro: il film in bianco e nero della statua, come nel sito. */
function PannelloFilm() {
  return (
    <div className="relative hidden overflow-hidden bg-ink-deep text-paper lg:block">
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/marmo/hero-poster-mono.jpg"
        className="absolute inset-0 size-full object-cover grayscale contrast-105 brightness-[0.8]"
      >
        <source src="/marmo/hero-statue.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-ink/45 to-ink/80" aria-hidden />
      <div className="relative z-[2] flex h-full flex-col justify-between p-12">
        <MarmoLogo altezza={28} />
        <div>
          <p className="eyebrow text-paper/60">Area riservata</p>
          <h2 className="mt-4 max-w-[420px] text-[46px] leading-[1.05] font-normal tracking-[-0.02em] text-paper">
            Bentornato. La tua area ti aspetta.
          </h2>
        </div>
      </div>
    </div>
  );
}

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
    <main className="grid min-h-screen bg-card lg:grid-cols-[1.05fr_1fr]">
      <PannelloFilm />

      <div className="flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-[360px]">
          <div className="mb-10 lg:hidden">
            <MarmoLogo altezza={22} />
          </div>
          <h1 className="mb-2 text-[38px] leading-none">Accedi</h1>
          <p className="mb-8 text-sm text-muted-foreground">Inserisci le credenziali che ti ha fornito Wesley.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-[18px]" noValidate>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-semibold tracking-[-0.01em]">Email</FormLabel>
                    <FormControl>
                      <Input className="h-[42px]" type="email" autoComplete="email" placeholder="nome@email.it" {...field} />
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
                    <FormLabel className="text-[13px] font-semibold tracking-[-0.01em]">Password</FormLabel>
                    <FormControl>
                      <Input className="h-[42px]" type="password" autoComplete="current-password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="mt-2.5 w-full" disabled={invio}>
                {invio ? "Accesso in corso…" : "Accedi"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 flex justify-between gap-3 text-xs text-muted-foreground">
            <a href={SITO_PUBBLICO} className="text-muted-foreground transition-colors hover:text-foreground">
              ← Torna al sito
            </a>
            <span>Problemi? Scrivi a Wesley.</span>
          </div>
          <p className="mt-7 text-center text-xs text-muted-foreground/80">Accesso protetto e tracciato.</p>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
