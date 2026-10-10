import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  FileSignature,
  KanbanSquare,
  LayoutGrid,
  LogOut,
  Plus,
  ShieldAlert,
  Tag,
  Tags,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";
import { useAuth, esFinance, esTeam, etichettaRuolo } from "@/features/auth";
import { NuovoLeadRapido } from "@/features/pipeline";
import { Button } from "@/shared/components/ui/button";
import { MarmoLogo } from "@/shared/components/brand/MarmoLogo";
import { Monogramma } from "@/shared/components/brand/Monogramma";
import { ContenutoPagina } from "@/shared/components/layout/ContenutoPagina";
import { MenuMobile } from "@/shared/components/layout/MenuMobile";
import { useRegistraSito } from "@/shared/hooks/useRegistraSito";
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
  { href: "/finance", label: "Finance", icon: TrendingUp, soloFinance: true },
  { href: "/contratti", label: "Contratti", icon: FileSignature, soloFinance: true },
  { href: "/offerte", label: "Offerte", icon: Tag, soloAdmin: true },
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
  ["/finance", "Finance"],
  ["/contratti/nuovo", "Nuovo invito"],
  ["/contratti", "Contratti"],
  ["/offerte", "Offerte"],
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
          "flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
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

function NavGestionale({ principali, secondarie }: { principali: VoceNav[]; secondarie: VoceNav[] }) {
  return (
    <nav aria-label="Principale" className="flex flex-1 flex-col gap-0.5 px-3.5 pt-4 pb-4">
      <p className="eyebrow px-2.5 pt-2 pb-1.5 text-[10px]">Gestionale</p>
      {principali.map((v) => (
        <VoceSidebar key={v.href} voce={v} />
      ))}
      <p className="eyebrow px-2.5 pt-5 pb-1.5 text-[10px]">Sistema</p>
      {secondarie.map((v) => (
        <VoceSidebar key={v.href} voce={v} />
      ))}
    </nav>
  );
}

function UtenteSidebar({ nome, ruolo, email }: { nome: string | undefined; ruolo: string; email: string | undefined }) {
  return (
    <div className="flex min-w-0 items-center gap-[11px] px-2.5 py-2">
      <Monogramma nome={nome} inverso />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-sidebar-foreground">{ruolo}</span>
        <span className="block max-w-[150px] truncate text-[11px] text-muted-foreground">{email}</span>
      </span>
    </div>
  );
}

/**
 * Shell del gestionale (Marmo Console): sidebar 256px + topbar 64px + contenuto.
 * Sotto md la sidebar diventa il pannello ☰ (`MenuMobile`) e le azioni della topbar restano icone.
 */
export function AppShell() {
  const { utente, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const rol = utente?.rol ?? null;
  const puoFinance = esFinance(rol);
  const eAdmin = rol === "admin";
  // Il dominio da cui lavora il team serve ai link delle notifiche Telegram (vedi useRegistraSito).
  useRegistraSito(esTeam(rol));

  const filtra = (v: VoceNav) => (!v.soloFinance || puoFinance) && (!v.soloAdmin || eAdmin);
  const principali = VOCI_PRINCIPALI.filter(filtra);
  const secondarie = VOCI_SECONDARIE.filter(filtra);
  const utenteCard = <UtenteSidebar nome={utente?.nombre || utente?.email} ruolo={rol ? etichettaRuolo(rol) : "Utente"} email={utente?.email} />;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-(--sidebar-w) shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-(--header-h) items-center border-b border-border-faint px-5">
          <MarmoLogo altezza={20} />
        </div>

        <NavGestionale principali={principali} secondarie={secondarie} />

        <div className="border-t border-border-faint p-3.5">{utenteCard}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-(--header-h) shrink-0 items-center justify-between gap-2 border-b bg-card/85 px-4 backdrop-blur-md md:gap-3 md:px-8">
          <div className="flex min-w-0 items-center gap-1">
            <MenuMobile
              testata={<MarmoLogo altezza={20} />}
              piede={
                <div className="grid gap-2">
                  {utenteCard}
                  <Button variant="outline" className="w-full" onClick={() => void signOut()}>
                    <LogOut aria-hidden /> Esci
                  </Button>
                </div>
              }
            >
              <NavGestionale principali={principali} secondarie={secondarie} />
            </MenuMobile>
            <h1 className="min-w-0 truncate font-sans text-[17px] font-semibold tracking-[-0.01em]">{titoloPer(pathname)}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <NuovoLeadRapido />
            <Button size="sm" onClick={() => navigate("/clienti/nuovo")} aria-label="Nuovo cliente" title="Nuovo cliente">
              <Plus aria-hidden />
              <span className="hidden sm:inline">Nuovo cliente</span>
            </Button>
            <Button size="icon" variant="outline" className="hidden text-muted-foreground md:inline-flex" aria-label="Esci" title="Esci" onClick={() => void signOut()}>
              <LogOut aria-hidden />
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-16 md:p-8">
          <ContenutoPagina />
        </main>
      </div>
    </div>
  );
}
