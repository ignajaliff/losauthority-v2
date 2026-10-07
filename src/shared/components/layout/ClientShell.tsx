import { Link, NavLink } from "react-router-dom";
import { BarChart3, Brain, GraduationCap, LayoutGrid, Palette, Route, Users, WandSparkles } from "lucide-react";
import { useAuth } from "@/features/auth";
import { Button } from "@/shared/components/ui/button";
import { MarmoLogo } from "@/shared/components/brand/MarmoLogo";
import { Monogramma } from "@/shared/components/brand/Monogramma";
import { ContenutoPagina } from "@/shared/components/layout/ContenutoPagina";
import { cn } from "@/lib/utils";

interface VocePercorso {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
}

/** Sezioni del percorso; il "Cervello del tuo branding" è a parte, con una voce in evidenza. */
const VOCI_PERCORSO: VocePercorso[] = [
  { href: "/area/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/area/stili", label: "Stili", icon: Palette },
  { href: "/area/crea-idee", label: "Crea idee", icon: WandSparkles },
  { href: "/area/workflow", label: "Workflow", icon: Route },
  { href: "/area/pubblicazioni", label: "Pubblicazioni", icon: BarChart3 },
  { href: "/area/clienti", label: "Clienti", icon: Users },
  { href: "/area/coach", label: "Wesley Coach", icon: GraduationCap },
];

const HREF_CERVELLO = "/area/cervello";

function VoceNav({ voce, compatta = false }: { voce: VocePercorso; compatta?: boolean }) {
  const Icon = voce.icon;
  return (
    <NavLink
      to={voce.href}
      className={({ isActive }) =>
        cn(
          "flex shrink-0 items-center gap-3 rounded-md text-sm transition-colors",
          compatta ? "px-3 py-2" : "px-3 py-2.5",
          isActive
            ? "bg-sidebar-accent font-semibold text-sidebar-foreground [&_svg]:opacity-100"
            : "font-medium text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground [&_svg]:opacity-70",
        )
      }
    >
      <Icon className="size-[17px]" strokeWidth={1.5} aria-hidden />
      {voce.label}
    </NavLink>
  );
}

/** La voce "Cervello del tuo branding": più importante delle altre, quindi una card con il cervello e il titolo in serif (attiva anche nelle sottopagine). */
function VoceCervello({ compatta = false }: { compatta?: boolean }) {
  if (compatta) {
    return (
      <NavLink
        to={HREF_CERVELLO}
        className={({ isActive }) =>
          cn(
            "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            isActive ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:bg-sidebar-accent/70",
          )
        }
      >
        <Brain className="size-4" strokeWidth={1.5} aria-hidden />
        Cervello
      </NavLink>
    );
  }
  return (
    <NavLink
      to={HREF_CERVELLO}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-lg border px-3 py-3 transition-[border-color,background-color,box-shadow] duration-300",
          isActive
            ? "border-foreground/40 bg-sidebar-accent shadow-xs"
            : "border-border bg-card hover:border-foreground/25 hover:bg-sidebar-accent/60 hover:shadow-xs",
        )
      }
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform duration-300 group-hover:scale-105">
        <Brain className="size-[18px]" strokeWidth={1.5} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="eyebrow block text-[9px]">Il tuo branding</span>
        <span className="block font-display text-[17px] leading-tight font-medium text-sidebar-foreground">Cervello del tuo branding</span>
      </span>
    </NavLink>
  );
}

function SidebarPercorso() {
  const { utente } = useAuth();
  return (
    <aside className="sticky top-0 hidden h-screen w-(--sidebar-w) shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-(--header-h) items-center border-b border-border-faint px-5">
        <Link to="/area/dashboard" aria-label="La tua area" className="text-foreground">
          <MarmoLogo altezza={20} />
        </Link>
      </div>
      <nav aria-label="Il tuo percorso" className="flex flex-1 flex-col gap-0.5 px-3.5 pt-4">
        {VOCI_PERCORSO.map((v) => (
          <VoceNav key={v.href} voce={v} />
        ))}
        <div className="pt-5">
          <VoceCervello />
        </div>
      </nav>
      <div className="border-t border-border-faint p-3.5">
        <div className="flex min-w-0 items-center gap-[11px] px-2.5 py-2">
          <Monogramma nome={utente?.nombre || utente?.email} inverso />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-sidebar-foreground">{utente?.nombre || "Cliente"}</span>
            <span className="block max-w-[150px] truncate text-[11px] text-muted-foreground">{utente?.email}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}

interface ClientShellProps {
  /** true nello spazio cliente (dopo l'onboarding): sidebar a sinistra con le sezioni. */
  conNav?: boolean;
}

/**
 * Shell dell'area cliente (Marmo). Durante l'onboarding: solo logo + "Esci" e
 * colonna centrale da 820px. Con `conNav`: sidebar a sinistra (Dashboard, Stili,
 * Crea idee, Workflow, Pubblicazioni, Wesley Coach) e, in evidenza, la card
 * "Cervello del tuo branding" (Avatar, Offerta, Clienti, Kit Brand); topbar con "Esci".
 */
export function ClientShell({ conNav = false }: ClientShellProps) {
  const { signOut } = useAuth();
  const esci = (
    <Button size="sm" variant="ghost" onClick={() => void signOut()}>
      Esci
    </Button>
  );

  if (!conNav) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between gap-4 border-b bg-card px-6 py-4">
          <Link to="/area" aria-label="La tua area" className="text-foreground">
            <MarmoLogo altezza={22} />
          </Link>
          {esci}
        </header>
        <main className="mx-auto w-full max-w-[820px] flex-1 px-6 pt-11 pb-20">
          <ContenutoPagina />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarPercorso />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-(--header-h) shrink-0 items-center justify-between gap-3 border-b bg-card/85 px-4 backdrop-blur-md md:justify-end md:px-8">
          <Link to="/area/dashboard" aria-label="La tua area" className="text-foreground md:hidden">
            <MarmoLogo altezza={20} />
          </Link>
          {esci}
        </header>
        <nav
          aria-label="Il tuo percorso (mobile)"
          className="flex items-center gap-1 overflow-x-auto border-b bg-card px-3 py-2 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {VOCI_PERCORSO.map((v) => (
            <VoceNav key={v.href} voce={v} compatta />
          ))}
          <VoceCervello compatta />
        </nav>
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pt-10 pb-20 md:px-8">
          <ContenutoPagina />
        </main>
      </div>
    </div>
  );
}
