import type { HTMLAttributes } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/lib/utils";
import type { TipoCliente } from "@contratti/tipi.ts";
import type { Errori } from "@contratti/validazione.ts";
import type { Campi } from "./campi";
import { Avviso, Titolino } from "./Spunta";

interface CampoDef {
  nome: string;
  label: string;
  aiuto?: string;
  type?: string;
  placeholder?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  maiuscolo?: boolean;
}

interface CampoProps extends CampoDef {
  valore: string;
  errore: string | undefined;
  onChange: (nome: string, valore: string) => void;
}

/** Un campo del modulo: etichetta, input e, sotto, l'errore (dalla stessa validazione del server) o l'aiuto. */
function Campo({ nome, label, aiuto, type = "text", placeholder, inputMode, autoComplete, maiuscolo = false, valore, errore, onChange }: CampoProps) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={`c-${nome}`}>{label}</Label>
      <Input
        id={`c-${nome}`}
        type={type}
        value={valore}
        onChange={(e) => onChange(nome, maiuscolo ? e.target.value.toUpperCase() : e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCapitalize={maiuscolo ? "characters" : undefined}
        aria-invalid={errore ? true : undefined}
        aria-describedby={errore ? `e-${nome}` : undefined}
        // 16px: sotto questa misura l'iPhone ingrandisce la pagina a ogni campo.
        className={cn("text-base", errore && "border-status-churn")}
      />
      {errore ? (
        <p id={`e-${nome}`} role="alert" className="text-xs text-status-churn">
          {errore}
        </p>
      ) : aiuto ? (
        <p className="text-xs text-muted-foreground">{aiuto}</p>
      ) : null}
    </div>
  );
}

interface PassoDatiProps {
  tipo: TipoCliente;
  campi: Campi;
  errori: Errori;
  messaggio: string | null;
  inviando: boolean;
  onCampo: (nome: string, valore: string) => void;
  onCopiaRappresentante: () => void;
  onIndietro: () => void;
  onElabora: () => void;
}

const griglia = "grid gap-3.5 sm:grid-cols-2";

/** Passo 3: i dati del cliente, diversi per privato / partita IVA / società. */
export function PassoDati({ tipo, campi, errori, messaggio, inviando, onCampo, onCopiaRappresentante, onIndietro, onElabora }: PassoDatiProps) {
  const campo = (def: CampoDef) => <Campo key={def.nome} {...def} valore={campi[def.nome] ?? ""} errore={errori[def.nome]} onChange={onCampo} />;

  const indirizzo = (titolo: string) => (
    <>
      <Titolino>{titolo}</Titolino>
      <div className={griglia}>
        {campo({ nome: "indirizzo.via", label: "Via e numero civico", placeholder: "Via Roma 12", autoComplete: "street-address" })}
        {campo({ nome: "indirizzo.cap", label: "CAP", placeholder: "20100", inputMode: "numeric", autoComplete: "postal-code" })}
        {campo({ nome: "indirizzo.citta", label: "Comune", placeholder: "Milano", autoComplete: "address-level2" })}
        {campo({ nome: "indirizzo.provincia", label: "Provincia (sigla)", placeholder: "MI", maiuscolo: true })}
      </div>
    </>
  );
  const persona = (
    <>
      <Titolino>Chi sei</Titolino>
      <div className={griglia}>
        {campo({ nome: "nome", label: "Nome", autoComplete: "given-name" })}
        {campo({ nome: "cognome", label: "Cognome", autoComplete: "family-name" })}
        {campo({ nome: "luogo_nascita", label: "Nato/a a", placeholder: "Comune o Stato estero" })}
        {campo({ nome: "data_nascita", label: "Data di nascita", type: "date", autoComplete: "bday" })}
        {campo({ nome: "codice_fiscale", label: "Codice fiscale", placeholder: "16 caratteri", maiuscolo: true })}
      </div>
    </>
  );
  const fattura = (
    <>
      <Titolino>Fattura elettronica</Titolino>
      <div className={griglia}>
        {campo({ nome: "codice_destinatario", label: "Codice destinatario (SdI)", placeholder: "7 caratteri", maiuscolo: true, aiuto: "Basta uno dei due: codice oppure PEC." })}
        {campo({ nome: "pec", label: "PEC", type: "email", placeholder: "nome@pec.it", inputMode: "email" })}
      </div>
    </>
  );
  const contatti = (titolo: string, aiutoEmail: string) => (
    <>
      <Titolino>{titolo}</Titolino>
      <div className={griglia}>
        {campo({ nome: "email", label: "Email", type: "email", inputMode: "email", autoComplete: "email", aiuto: aiutoEmail })}
        {campo({ nome: "telefono", label: "Cellulare", type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "+39 333 1234567", aiuto: "Serve per il gruppo WhatsApp." })}
        {campo({ nome: "instagram", label: "Instagram (facoltativo)", placeholder: "@nome" })}
        {campo({ nome: "tiktok", label: "TikTok (facoltativo)", placeholder: "@nome" })}
      </div>
    </>
  );

  return (
    <>
      <h1 className="text-[30px] leading-[1.15]">I tuoi dati</h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        Finiscono nel contratto così come li scrivi: controllali bene. Quando premi <strong>Elabora</strong> vedi il contratto completo, e puoi ancora tornare
        indietro a correggere.
      </p>

      {tipo === "privato" ? (
        <>
          {persona}
          {indirizzo("Residenza")}
          {contatti("Contatti", "Qui ricevi gli accessi e le comunicazioni.")}
        </>
      ) : null}

      {tipo === "professionista" ? (
        <>
          {persona}
          <Titolino>La tua attività</Titolino>
          <div className={griglia}>{campo({ nome: "partita_iva", label: "Partita IVA", placeholder: "11 cifre", inputMode: "numeric" })}</div>
          {indirizzo("Sede dell'attività")}
          {fattura}
          {contatti("Contatti", "Qui ricevi gli accessi e le comunicazioni.")}
        </>
      ) : null}

      {tipo === "societa" ? (
        <>
          <Titolino>La società</Titolino>
          <div className={griglia}>
            {campo({ nome: "ragione_sociale", label: "Ragione sociale", placeholder: "Es. Rossi S.r.l.", autoComplete: "organization" })}
            {campo({ nome: "partita_iva", label: "Partita IVA", placeholder: "11 cifre", inputMode: "numeric" })}
            {campo({ nome: "codice_fiscale", label: "Codice fiscale della società", placeholder: "Di solito uguale alla partita IVA", maiuscolo: true })}
          </div>
          {indirizzo("Sede legale")}
          {fattura}
          <Titolino>Legale rappresentante (chi firma)</Titolino>
          <div className={griglia}>
            {campo({ nome: "rappresentante_nome", label: "Nome", autoComplete: "given-name" })}
            {campo({ nome: "rappresentante_cognome", label: "Cognome", autoComplete: "family-name" })}
          </div>
          <Titolino>Chi segue il programma</Titolino>
          <p className="text-sm text-muted-foreground">Il programma è per una sola persona: è lei a ricevere gli accessi.</p>
          <div className={griglia}>
            {campo({ nome: "partecipante_nome", label: "Nome" })}
            {campo({ nome: "partecipante_cognome", label: "Cognome" })}
          </div>
          <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={onCopiaRappresentante}>
            È la stessa persona che firma
          </Button>
          {contatti("Contatti di chi segue il programma", "Qui arrivano gli accessi e le comunicazioni.")}
        </>
      ) : null}

      <Avviso testo={messaggio} />
      <div className="flex gap-2.5">
        <Button size="lg" variant="outline" onClick={onIndietro} disabled={inviando}>
          Indietro
        </Button>
        <Button size="lg" className="flex-1" onClick={onElabora} disabled={inviando}>
          {inviando ? "Elaboro…" : "Elabora"}
        </Button>
      </div>
    </>
  );
}
