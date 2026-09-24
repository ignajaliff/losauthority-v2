import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useEliminaCliente } from "../hooks/useAccountCliente";
import type { ClienteDettaglio } from "../types";

/** Zona pericolosa (solo admin): elimina account e tutti i dati, chiedendo di digitare l'email. */
export function EliminaCliente({ cliente }: { cliente: ClienteDettaglio }) {
  const navigate = useNavigate();
  const elimina = useEliminaCliente(cliente.id);
  const [aperto, setAperto] = useState(false);
  const [conferma, setConferma] = useState("");
  const email = cliente.utente.email;
  const corrisponde = conferma.trim().toLowerCase() === email.toLowerCase();

  function onConferma() {
    elimina.mutate(undefined, {
      onSuccess: () => {
        setAperto(false);
        navigate("/clienti", { replace: true });
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zona pericolosa</CardTitle>
        <CardDescription>Elimina l'account e tutti i dati (schede, call, fatture, note). Irreversibile.</CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={aperto} onOpenChange={setAperto}>
          <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
            <Trash2 aria-hidden />
            Elimina cliente
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminare {cliente.utente.nombre}?</AlertDialogTitle>
              <AlertDialogDescription>
                Per confermare scrivi l'email del cliente: <strong>{email}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="conferma-email">Email del cliente</Label>
              <Input id="conferma-email" autoComplete="off" value={conferma} onChange={(e) => setConferma(e.target.value)} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction variant="destructive" disabled={!corrisponde || elimina.isPending} onClick={onConferma}>
                {elimina.isPending ? "Elimino…" : "Elimina definitivamente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
