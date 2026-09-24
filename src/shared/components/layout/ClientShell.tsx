import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { Button } from "@/shared/components/ui/button";
import { MarmoLogo } from "@/shared/components/brand/MarmoLogo";

/** Shell dell'area cliente (Marmo): logo, "Esci", colonna centrale da 820px. */
export function ClientShell() {
  const { signOut } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between gap-4 border-b bg-card px-6 py-4">
        <Link to="/area" aria-label="La tua area" className="text-foreground">
          <MarmoLogo altezza={22} />
        </Link>
        <Button size="sm" variant="ghost" onClick={() => void signOut()}>
          Esci
        </Button>
      </header>
      <main className="mx-auto w-full max-w-[820px] flex-1 px-6 pt-11 pb-20">
        <Outlet />
      </main>
    </div>
  );
}
