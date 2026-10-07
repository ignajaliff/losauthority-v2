import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Textarea } from "@/shared/components/ui/textarea";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { formatDate } from "@/shared/utils/formatDate";
import { useContattiAssistenza } from "../hooks/useAssistenzaCrm";
import { etichettaFonte, etichettaStato } from "../types";

const MOTIVO_MIN = 5;

interface ContattiAssistenzaDialogProps {
  clienteId: string;
  nomeCliente: string;
  aperto: boolean;
  onChiudi: () => void;
}

/** Popup per il team: motivo → accesso registrato → contatti in sola lettura. Alla chiusura non resta niente. */
export function ContattiAssistenzaDialog({ clienteId, nomeCliente, aperto, onChiudi }: ContattiAssistenzaDialogProps) {
  return (
    <Dialog open={aperto} onOpenChange={(open) => (open ? null : onChiudi())}>
      <DialogContent className="sm:max-w-3xl">
        {/* Il contenuto si smonta alla chiusura: motivo e contatti spariscono. */}
        <Contenuto clienteId={clienteId} nomeCliente={nomeCliente} onChiudi={onChiudi} />
      </DialogContent>
    </Dialog>
  );
}

function Contenuto({ clienteId, nomeCliente, onChiudi }: Omit<ContattiAssistenzaDialogProps, "aperto">) {
  const [motivo, setMotivo] = useState("");
  const apri = useContattiAssistenza(clienteId);
  const contatti = apri.data;
  const motivoValido = motivo.trim().length >= MOTIVO_MIN;

  if (!contatti) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Contatti di {nomeCliente} · assistenza</DialogTitle>
          <DialogDescription>
            I contatti sono dati del cliente: aprili solo se serve per aiutarlo. L'accesso viene registrato (chi, quando, su quale cliente e
            perché) e i contatti si vedono in sola lettura.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="motivo-assistenza">Motivo dell'accesso *</Label>
          <Textarea
            id="motivo-assistenza"
            rows={2}
            maxLength={300}
            placeholder="Es. Il cliente non riesce a esportare i contatti"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          {motivo.length > 0 && !motivoValido ? <p className="text-xs text-destructive">Scrivi almeno {MOTIVO_MIN} caratteri.</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onChiudi}>
            Annulla
          </Button>
          <Button disabled={!motivoValido || apri.isPending} onClick={() => apri.mutate(motivo.trim())}>
            <ShieldAlert aria-hidden /> {apri.isPending ? "Registro l'accesso…" : "Registra l'accesso e apri"}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Contatti di {nomeCliente} · sola lettura</DialogTitle>
        <DialogDescription>Accesso registrato. Motivo: «{motivo.trim()}». Chiudi quando hai finito.</DialogDescription>
      </DialogHeader>
      {contatti.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Il cliente non ha contatti.</p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contatto</TableHead>
                <TableHead>Canale</TableHead>
                <TableHead>Arrivato il</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="hidden sm:table-cell">Offerta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contatti.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="max-w-56">
                    <span className="block truncate font-medium">{c.nome}</span>
                    {c.email || c.telefono ? (
                      <span className="block truncate text-xs text-muted-foreground">{[c.email, c.telefono].filter(Boolean).join(" · ")}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-muted-foreground">{etichettaFonte(c.canale) ?? c.canale}</TableCell>
                  <TableCell className="text-[12.5px] text-muted-foreground">{formatDate(c.arrivato_il)}</TableCell>
                  <TableCell className="text-[12.5px]">
                    {etichettaStato(c.stato)}
                    {c.valore !== null ? <span className="figure block text-[11px] text-muted-foreground">{formatCurrency(c.valore)}</span> : null}
                  </TableCell>
                  <TableCell className="hidden max-w-48 truncate text-[12.5px] text-muted-foreground sm:table-cell">{c.offerta ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <DialogFooter>
        <Button onClick={onChiudi}>Chiudi</Button>
      </DialogFooter>
    </>
  );
}
