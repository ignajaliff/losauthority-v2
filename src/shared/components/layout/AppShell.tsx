import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Inbox,
  KanbanSquare,
  LayoutGrid,
  LogOut,
  Plus,
  ShieldAlert,
  Tags,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";
import { useAuth, esFinance, etichettaRuolo } from "@/features/auth";
import { Button } from "@/shared/components/ui/button";
import { MarmoLogo } from "@/shared/components/brand/MarmoLogo";
import { Monogramma } from "@/shared/components/brand/Monogramma";
import { cn } from "@/lib/utils";

interface VoceNav {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  soloFinance?: boolean;
  soloAdmin?: boolean;
}

const VOCI_PRINCIPALI: VoceNav[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/clienti", label: "Clienti", icon: Users },
  { href: "/onboarding", label: "Onboarding", icon: Inbox },
  { href: "/finance", label: "Finance", icon: TrendingUp, soloFinance: true },
  { href: "/lezioni", label: "Lezioni", icon: BookOpen, soloAdmin: true },
];

const VOCI_SECONDARIE: VoceNav[] = [
  { href: "/staff", label: "Staff", icon: UserCog, soloAdmin: true },
  { href: "/tag", label: "Tag", icon: Tags },
  { href: "/errori", label: "Errori", icon: ShieldAlert },
];

const TITOLI: Array<[string, string]> = [
  ["/dashboard", "Dashboard"],
  ["/pipeline", "Pipeline"],
  ["/clienti/nuovo", "Nuovo cliente"],
  ["/clienti", "Clienti"],
  ["/onboarding", "Onboarding"],
  ["/finance", "Finance"],
  ["/lezioni", "Lezioni"],
  ["/staff/nuovo", "Nuovo staff"],
  ["/staff", "Staff"],
  ["/tag", "Tag"],
  ["/errori", "Errori"],
];

function titoloPer(pathname: string): string {
  return TITOLI.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Gestionale";
}

function VoceSidebar({ voce, compatta = false }: { voce: VoceNav; compatta?: boolean }) {
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

/** Shell del gestionale (Marmo Console): sidebar 256px + topbar 64px + contenuto. */
export function AppShell() {
  const { utente, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const rol = utente?.rol ?? null;
  const puoFinance = esFinance(rol);
  const eAdmin = rol === "admin";

  const filtra = (v: VoceNav) => (!v.soloFinance || puoFinance) && (!v.soloAdmin || eAdmin);
  const principali = VOCI_PRINCIPALI.filter(filtra);
  const secondarie = VOCI_SECONDARIE.filter(filtra);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-(--sidebar-w) shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-(--header-h) items-center border-b border-border-faint px-5">
          <MarmoLogo altezza={20} />
        </div>

        <nav aria-label="Principale" className="flex flex-1 flex-col gap-0.5 px-3.5 pt-4">
          <p className="eyebrow px-2.5 pt-2 pb-1.5 text-[10px]">Gestionale</p>
          {principali.map((v) => (
            <VoceSidebar key={v.href} voce={v} />
          ))}
          <p className="eyebrow px-2.5 pt-5 pb-1.5 text-[10px]">Sistema</p>
          {secondarie.map((v) => (
            <VoceSidebar key={v.href} voce={v} />
          ))}
        </nav>

        <div className="border-t border-border-faint p-3.5">
          <div className="flex min-w-0 items-center gap-[11px] px-2.5 py-2">
            <Monogramma nome={utente?.nombre || utente?.email} inverso />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-sidebar-foreground">
                {rol ? etichettaRuolo(rol) : "Utente"}
              </span>
              <span className="block max-w-[150px] truncate text-[11px] text-muted-foreground">{utente?.email}</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-(--header-h) shrink-0 items-center justify-between gap-3 border-b bg-card/85 px-4 backdrop-blur-md md:px-8">
          <h1 className="min-w-0 truncate font-sans text-[17px] font-semibold tracking-[-0.01em]">{titoloPer(pathname)}</h1>
          <div className="flex shrink-0 items-center gap-3">
            <Button size="sm" onClick={() => navigate("/clienti/nuovo")}>
              <Plus aria-hidden />
              Nuovo cliente
            </Button>
            <Button size="icon" variant="outline" className="text-muted-foreground" aria-label="Esci" title="Esci" onClick={() => void signOut()}>
              <LogOut aria-hidden />
            </Button>
          </div>
        </header>

        <nav
          aria-label="Principale (mobile)"
          className="flex gap-1 overflow-x-auto border-b bg-card px-3 py-2 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {[...principali, ...secondarie].map((v) => (
            <VoceSidebar key={v.href} voce={v} compatta />
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
