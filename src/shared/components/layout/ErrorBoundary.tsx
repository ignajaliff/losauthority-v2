import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/shared/components/ui/button";
import { logDev } from "@/shared/utils/errors";

interface Props {
  children: ReactNode;
}
interface State {
  errore: boolean;
}

function PaginaErrore() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Qualcosa è andato storto</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Si è verificato un errore imprevisto. Ricarica la pagina; se il problema continua, avvisa l'amministratore.
      </p>
      <Button onClick={() => window.location.reload()}>Ricarica la pagina</Button>
    </main>
  );
}

/** ErrorBoundary del layout radice: cattura gli errori di render inattesi. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { errore: false };

  static getDerivedStateFromError(): State {
    return { errore: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logDev(error, info);
  }

  render() {
    return this.state.errore ? <PaginaErrore /> : this.props.children;
  }
}
