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
import { Separator } from "@/shared/components/ui/separator";
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

function VoceSidebar({ voce }: { voce: VoceNav }) {
  const Icon = voce.icon;
  return (
    <NavLink
      to={voce.href}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )
      }
    >
      <Icon className="size-4" aria-hidden />
      {voce.label}
    </NavLink>
  );
}

/** Shell del gestionale: sidebar + topbar + contenuto (Outlet). */
export function AppShell() {
  const { utente, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const rol = utente?.rol ?? null;
  const puoFinance = esFinance(rol);
  const eAdmin = rol === "admin";

  const filtra = (v: VoceNav) => (!v.soloFinance || puoFinance) && (!v.soloAdmin || eAdmin);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <div className="mb-6 px-3">
          <p className="text-lg font-semibold tracking-tight">Los Authority</p>
          <p className="text-xs text-muted-foreground">Gestionale</p>
        </div>
        <nav aria-label="Principale" className="flex flex-col gap-1">
          {VOCI_PRINCIPALI.filter(filtra).map((v) => (
            <VoceSidebar key={v.href} voce={v} />
          ))}
        </nav>
        <Separator className="my-4" />
        <nav aria-label="Secondaria" className="flex flex-col gap-1">
          {VOCI_SECONDARIE.filter(filtra).map((v) => (
            <VoceSidebar key={v.href} voce={v} />
          ))}
        </nav>
        <div className="mt-auto px-3 pt-4">
          <p className="truncate text-sm font-medium">{utente?.nombre}</p>
          <p className="truncate text-xs text-muted-foreground">{utente?.email}</p>
          <p className="text-xs text-muted-foreground">{rol ? etichettaRuolo(rol) : ""}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b px-4 md:px-6">
          <h1 className="text-base font-semibold">{titoloPer(pathname)}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" onClick={() => navigate("/clienti/nuovo")}>
              <Plus className="size-4" aria-hidden />
              Nuovo cliente
            </Button>
            <Button size="sm" variant="ghost" aria-label="Esci" onClick={() => void signOut()}>
              <LogOut className="size-4" aria-hidden />
            </Button>
          </div>
        </header>
        <nav aria-label="Principale (mobile)" className="flex gap-1 overflow-x-auto border-b px-2 py-2 md:hidden">
          {[...VOCI_PRINCIPALI, ...VOCI_SECONDARIE].filter(filtra).map((v) => (
            <VoceSidebar key={v.href} voce={v} />
          ))}
        </nav>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
