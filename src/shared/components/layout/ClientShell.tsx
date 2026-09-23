import { Link, Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/features/auth";
import { Button } from "@/shared/components/ui/button";

/** Shell dell'area cliente: header essenziale + contenuto. */
export function ClientShell() {
  const { utente, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center gap-3 border-b px-4 md:px-6">
        <Link to="/area" className="text-base font-semibold tracking-tight">
          Los Authority
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{utente?.nombre}</span>
          <Button size="sm" variant="ghost" aria-label="Esci" onClick={() => void signOut()}>
            <LogOut className="size-4" aria-hidden />
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
