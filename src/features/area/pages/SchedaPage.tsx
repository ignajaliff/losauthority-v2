import { useState } from "react";
import { SchedaFlow } from "@/features/scheda";
import { TransizioneOnboarding } from "../components/TransizioneOnboarding";

/**
 * /area/onboarding → compilazione (o rilettura) della scheda onboarding.
 * All'invio parte la transizione animata che porta allo spazio cliente.
 */
export default function SchedaPage() {
  const [inviata, setInviata] = useState(false);
  return (
    <>
      <SchedaFlow onInviata={() => setInviata(true)} />
      {inviata ? <TransizioneOnboarding /> : null}
    </>
  );
}
