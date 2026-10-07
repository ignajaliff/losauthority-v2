import { useState } from "react";
import { haDossier, type Avatar } from "../types";
import { CartaAvatar } from "./CartaAvatar";
import { DossierAvatar } from "./DossierAvatar";

interface CartaGirevoleProps {
  avatar: Avatar;
  numero: number;
  titolare: string;
  inCompilazione: boolean;
}

/** Fronte (carta d'identità) e retro (dossier): "Gira" ruota la carta con una piccola animazione. */
export function CartaGirevole({ avatar, numero, titolare, inCompilazione }: CartaGirevoleProps) {
  const [lato, setLato] = useState<"fronte" | "dossier">("fronte");
  const gira = () => setLato((l) => (l === "fronte" ? "dossier" : "fronte"));
  return (
    <div key={lato} className="marmo-carta-gira">
      {lato === "fronte" ? (
        <CartaAvatar avatar={avatar} numero={numero} titolare={titolare} inCompilazione={inCompilazione} onGira={gira} dossierPronto={haDossier(avatar)} />
      ) : (
        <DossierAvatar avatar={avatar} numero={numero} onGira={gira} />
      )}
    </div>
  );
}
