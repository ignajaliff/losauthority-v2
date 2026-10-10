import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/shared/components/ui/sheet";

interface MenuMobileProps {
  /** Testata del pannello (di solito il logo). */
  testata: ReactNode;
  /** Le voci di navigazione: un clic su un link chiude il pannello da solo. */
  children: ReactNode;
  /** Il piede del pannello: utente ed «Esci». */
  piede?: ReactNode;
  etichetta?: string;
}

/**
 * Sotto md la sidebar diventa un pannello che entra da sinistra, aperto dal
 * bottone ☰ della topbar. Si chiude toccando fuori, con la X o scegliendo una
 * voce (qualsiasi link dentro il pannello).
 */
export function MenuMobile({ testata, children, piede, etichetta = "Apri il menu" }: MenuMobileProps) {
  const [aperto, setAperto] = useState(false);
  return (
    <Sheet open={aperto} onOpenChange={setAperto}>
      <SheetTrigger render={<Button size="icon" variant="ghost" className="-ml-2 md:hidden" aria-label={etichetta} title={etichetta} />}>
        <Menu aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(86vw,320px)] gap-0 bg-sidebar p-0">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Le sezioni del sistema</SheetDescription>
        <div className="flex h-(--header-h) shrink-0 items-center border-b border-border-faint px-5">{testata}</div>
        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setAperto(false);
          }}
        >
          {children}
        </div>
        {piede ? <div className="shrink-0 border-t border-border-faint p-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">{piede}</div> : null}
      </SheetContent>
    </Sheet>
  );
}
