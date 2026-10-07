import { useState } from "react";
import { Eye } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDateTime } from "@/shared/utils/formatDate";
import { useAccessiAssistenza, useAccettazioniCliente, useVersioneInVigoreCrm } from "../hooks/useAssistenzaCrm";
import { ContattiAssistenzaDialog } from "./ContattiAssistenzaDialog";

interface AssistenzaCrmProps {
  clienteId: string;
  nomeCliente: string;
}

/**
 * Scheda cliente (team) → Impostazioni: stato della sezione Clienti del cliente
 * (accettazione dei documenti) e accesso ai contatti solo per assistenza, registrato.
 */
export function AssistenzaCrm({ clienteId, nomeCliente }: AssistenzaCrmProps) {
  const accettazioni = useAccettazioniCliente(clienteId);
  const inVigore = useVersioneInVigoreCrm();
  const accessi = useAccessiAssistenza(clienteId);
  const [aperto, setAperto] = useState(false);

  const ultima = accettazioni.data?.[0] ?? null;
  const valida = ultima !== null && inVigore.data != null && ultima.versione === inVigore.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sezione Clienti (CRM del cliente)</CardTitle>
        <CardDescription>I contatti sono dati del cliente: il team li apre solo per assistenza e ogni accesso resta registrato.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-1 text-sm">
          {accettazioni.isLoading ? <p className="text-muted-foreground">Carico…</p> : null}
          {accettazioni.data && !ultima ? <p className="text-muted-foreground">Non ha ancora accettato i documenti: la sezione è chiusa.</p> : null}
          {ultima ? (
            <p className="flex flex-wrap items-center gap-2">
              Versione {ultima.versione} accettata il {formatDateTime(ultima.accettatoIl)}
              <Badge variant={valida ? "active" : "expiring"}>{valida ? "Valida" : "Da riaccettare"}</Badge>
            </p>
          ) : null}
          {accettazioni.data && accettazioni.data.length > 1 ? (
            <p className="text-xs text-muted-foreground">
              Prima: {accettazioni.data.slice(1).map((a) => `v${a.versione} il ${formatDateTime(a.accettatoIl)}`).join(" · ")}
            </p>
          ) : null}
        </div>

        <Button variant="outline" className="w-fit" onClick={() => setAperto(true)}>
          <Eye aria-hidden /> Vedi i contatti (assistenza)
        </Button>

        <div className="grid gap-2">
          <p className="eyebrow text-[10px]">Accessi per assistenza</p>
          {accessi.data && accessi.data.length === 0 ? <p className="text-xs text-muted-foreground">Nessun accesso.</p> : null}
          {accessi.data && accessi.data.length > 0 ? (
            <ul className="grid gap-1.5">
              {accessi.data.map((a) => (
                <li key={a.id} className="text-xs leading-relaxed">
                  <span className="font-medium">{formatDateTime(a.accesso_il)}</span> · {a.operatore_nome ?? "—"}
                  {a.operatore_ruolo ? ` (${a.operatore_ruolo})` : ""} · {a.contatti_visti} contatti ·{" "}
                  <span className="text-muted-foreground">«{a.motivo}»</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </CardContent>
      <ContattiAssistenzaDialog clienteId={clienteId} nomeCliente={nomeCliente} aperto={aperto} onChiudi={() => setAperto(false)} />
    </Card>
  );
}
