import { useEffect } from "react";
import { informativa } from "@contratti/informativa.ts";
import { ShellPubblica } from "../components/ShellPubblica";
import { TestoContratto } from "../components/TestoContratto";

/**
 * /informativa-privacy → l'informativa sul trattamento dei dati (art. 13 GDPR).
 * Pubblica: il cliente la apre dal primo passo del contratto, e il contratto la richiama con questo indirizzo.
 */
export default function InformativaPrivacyPage() {
  useEffect(() => {
    document.title = "Informativa privacy — Wesley Caicedo";
    return () => {
      document.title = "Los Authority";
    };
  }, []);
  return (
    <ShellPubblica>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <TestoContratto blocchi={informativa()} />
      </div>
    </ShellPubblica>
  );
}
