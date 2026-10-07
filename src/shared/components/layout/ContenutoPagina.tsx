import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";

/**
 * Tre puntini in loop: fallback mentre il chunk della pagina arriva.
 * Compare dopo un attimo (delay) così i caricamenti veloci non lampeggiano.
 */
export function CaricamentoPagina() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[40vh] items-center justify-center animate-in fade-in fill-mode-both delay-200 duration-500 motion-reduce:animate-none"
    >
      <span className="marmo-punti" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span className="sr-only">Caricamento…</span>
    </div>
  );
}

/**
 * Il contenuto della pagina dentro allo shell: al cambio di rotta si ricarica
 * SOLO questo, sidebar e topbar restano al loro posto. Il chunk lazy si aspetta
 * qui (puntini), poi la pagina entra in dissolvenza invece di comparire di colpo.
 */
export function ContenutoPagina() {
  const { pathname } = useLocation();
  return (
    <Suspense fallback={<CaricamentoPagina />}>
      <div key={pathname} className="animate-in fade-in duration-300 motion-reduce:animate-none">
        <Outlet />
      </div>
    </Suspense>
  );
}
