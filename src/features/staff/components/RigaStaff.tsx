import { KeyRound, Trash2 } from "lucide-react";
import { etichettaRuolo } from "@/features/auth";
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
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { formatDate } from "@/shared/utils/formatDate";
import { RUOLI_STAFF, type MembroStaff, type RuoloStaff } from "../types";

interface RigaStaffProps {
  membro: MembroStaff;
  sonoIo: boolean;
  occupato: boolean;
  onCambiaRuolo: (rol: RuoloStaff) => void;
  onResetPassword: () => void;
  onRimuovi: () => void;
}

const ETICHETTE_RUOLI: Record<string, string> = Object.fromEntries(
  RUOLI_STAFF.map((r) => [r.valore, r.etichetta]),
);

function iniziali(nome: string): string {
  const parti = nome.trim().split(/\s+/).filter(Boolean);
  return parti
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Una riga della lista staff: identità, ruolo e azioni dell'admin. */
export function RigaStaff({ membro, sonoIo, occupato, onCambiaRuolo, onResetPassword, onRimuovi }: RigaStaffProps) {
  const eAdmin = membro.rol === "admin";
  const modificabile = !eAdmin && !sonoIo;

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3 last:border-b-0">
      <Avatar>
        <AvatarFallback>{iniziali(membro.nombre || membro.email) || "?"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 basis-48">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{membro.nombre || "—"}</span>
          {sonoIo ? <Badge variant="outline">tu</Badge> : null}
        </div>
        <p className="text-xs text-muted-foreground wrap-anywhere md:truncate">
          {membro.email} · nel team dal {formatDate(membro.created_at)}
        </p>
      </div>

      {/* Telefono: permessi e azioni a capo, allineati al testo; da md `contents` li rimette nella riga. */}
      <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 pl-12 md:contents">
        {modificabile ? (
          <Select
            value={membro.rol}
            items={ETICHETTE_RUOLI}
            onValueChange={(v) => {
              if (v && v !== membro.rol) onCambiaRuolo(v as RuoloStaff);
            }}
            disabled={occupato}
          >
            <SelectTrigger size="sm" className="pointer-coarse:data-[size=sm]:h-9" aria-label={`Permessi di ${membro.nombre}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RUOLI_STAFF.map((r) => (
                <SelectItem key={r.valore} value={r.valore}>
                  {r.etichetta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant={eAdmin ? "default" : "secondary"}>{etichettaRuolo(membro.rol)}</Badge>
        )}

        {!sonoIo ? (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" disabled={occupato} onClick={onResetPassword}>
              <KeyRound aria-hidden />
              Reset password
            </Button>
            {modificabile ? (
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button size="icon-sm" variant="ghost" aria-label={`Rimuovi ${membro.nombre} dal team`} />}
                  disabled={occupato}
                >
                  <Trash2 aria-hidden />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Rimuovere {membro.nombre || membro.email} dal team?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Il suo account verrà eliminato e non potrà più accedere al gestionale.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={onRimuovi}>
                      Rimuovi dal team
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
