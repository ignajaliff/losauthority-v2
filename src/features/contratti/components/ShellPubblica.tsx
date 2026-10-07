import type { ReactNode } from "react";
import { MarmoLogo } from "@/shared/components/brand/MarmoLogo";

/** Cornice delle pagine pubbliche (contratto del cliente, informativa privacy): solo il logo in alto, niente navigazione. */
export function ShellPubblica({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="flex justify-center border-b bg-card px-5 py-4">
        <MarmoLogo altezza={20} />
      </header>
      <main className="mx-auto max-w-[760px] px-4 pt-7 pb-20">{children}</main>
    </div>
  );
}

/** Un avviso a tutta pagina (link non valido, invito ritirato). */
export function AvvisoPubblico({ titolo, testo }: { titolo: string; testo: string }) {
  return (
    <div className="grid gap-2 rounded-lg border bg-card p-6 shadow-sm">
      <h1 className="text-[28px] leading-tight">{titolo}</h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{testo}</p>
    </div>
  );
}
