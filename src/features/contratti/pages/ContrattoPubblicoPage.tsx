import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { SkeletonBlocco } from "@/shared/components/layout/StatoCaricamento";
import { STATI_FIRMATI } from "@contratti/tipi.ts";
import { apriInvito, type StatoInvito } from "../api-pubblica";
import { ContrattoFirmato } from "../components/pubblico/ContrattoFirmato";
import { ContrattoWizard } from "../components/pubblico/ContrattoWizard";
import { AvvisoPubblico, ShellPubblica } from "../components/ShellPubblica";

type Stato = { tipo: "carico" } | { tipo: "errore"; status: number; testo: string } | { tipo: "ok"; invito: StatoInvito };

/**
 * /contratto/:token → la pagina che apre il cliente dal suo link personale:
 * compila, legge, firma. Pubblica (nessun login): la chiave è il token.
 */
export default function ContrattoPubblicoPage() {
  const { token = "" } = useParams<{ token: string }>();
  const [stato, setStato] = useState<Stato>({ tipo: "carico" });

  useEffect(() => {
    document.title = "Il tuo contratto — Wesley Caicedo";
    // Il link è personale: niente motori di ricerca.
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      meta.remove();
      document.title = "Los Authority";
    };
  }, []);

  useEffect(() => {
    let vivo = true;
    void apriInvito(token).then((r) => {
      if (!vivo) return;
      if (r.ok) setStato({ tipo: "ok", invito: r });
      else setStato({ tipo: "errore", status: r.status, testo: r.error });
    });
    return () => {
      vivo = false;
    };
  }, [token]);

  let contenuto: React.ReactNode;
  if (stato.tipo === "carico") {
    contenuto = <SkeletonBlocco altezza="h-72" />;
  } else if (stato.tipo === "errore") {
    contenuto =
      stato.status === 0 ? (
        <AvvisoPubblico titolo="Connessione assente" testo="Non riesco a raggiungere il server. Controlla la rete e ricarica la pagina." />
      ) : (
        <AvvisoPubblico
          titolo="Link non valido"
          testo="Questo indirizzo non corrisponde a nessun contratto. Controlla di averlo copiato per intero, oppure chiedi a Wesley di rimandartelo."
        />
      );
  } else if (stato.invito.stato === "annullato") {
    contenuto = <AvvisoPubblico titolo="Link non più valido" testo="Questo invito è stato ritirato. Scrivi a Wesley per riceverne uno nuovo." />;
  } else if (STATI_FIRMATI.includes(stato.invito.stato) && stato.invito.firmato_il) {
    contenuto = <ContrattoFirmato token={token} firmatoIl={stato.invito.firmato_il} istruzioniPagamento={stato.invito.istruzioni_pagamento} />;
  } else {
    contenuto = (
      <ContrattoWizard
        token={token}
        programma={stato.invito.programma}
        durataMesi={stato.invito.durata_mesi}
        tipoIniziale={stato.invito.tipo}
        datiIniziali={stato.invito.dati}
        firmaFornitore={stato.invito.firma_fornitore}
        istruzioniPagamento={stato.invito.istruzioni_pagamento}
      />
    );
  }

  return <ShellPubblica>{contenuto}</ShellPubblica>;
}
