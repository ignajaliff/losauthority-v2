/**
 * Scrittore PDF minimo, senza dipendenze: testo impaginato (Times, con
 * grassetto e corsivo), linee e firme disegnate come tratti.
 *
 * Perché a mano: il sito gira su Cloudflare Workers, dove il tempo di calcolo
 * per richiesta è poco. Una libreria PDF generica decomprime e ricomprime
 * immagini e flussi; qui si scrive solo testo e qualche linea, in pochi
 * millisecondi. Il risultato è un PDF 1.4 standard con i font di base, che si
 * apre ovunque. A parità di dati produce SEMPRE gli stessi byte (niente date
 * di sistema, niente numeri casuali): l'impronta del file resta verificabile.
 */

import { atomi, codifica, FONT, LARGHEZZA_TESTO, larghezza, letterale, MARGINE, metadato, n, PAGINA, spezza, type Atomo, type Stile, type Tratto } from "./pdf-testo.ts";
import type { Firma } from "./tipi.ts";

export { codifica, LARGHEZZA_TESTO, larghezza, PAGINA, type Stile, type Tratto };

/* ---------- Impaginazione ---------- */

export interface OpzioniParagrafo {
  corpo?: number;
  interlinea?: number;
  allinea?: "sinistra" | "giustificato" | "centro";
  /** Rientro di tutto il paragrafo dal margine sinistro. */
  rientro?: number;
  /** Rientro in più delle righe dopo la prima (per gli elenchi). */
  sporgenza?: number;
  spazioDopo?: number;
  /** Grigio del testo: 0 = nero, 1 = bianco. */
  grigio?: number;
}

export interface OpzioniDocumento {
  titolo: string;
  autore: string;
  /** Data del documento: va nei metadati, NON l'ora del server (il file deve essere riproducibile). */
  data: Date;
  /** Testo a sinistra nel piè di pagina. */
  piede: string;
  /** Identificativo stabile del documento (32 cifre esadecimali). */
  id: string;
}

export class Pdf {
  private pagine: string[][] = [[]];
  /** Posizione verticale della prossima riga (in PDF l'asse y cresce verso l'alto). */
  private y = PAGINA.altezza - MARGINE.alto;

  constructor(private readonly opzioni: OpzioniDocumento) {}

  private get ops(): string[] {
    return this.pagine[this.pagine.length - 1];
  }

  /** Spazio verticale ancora libero nella pagina. */
  get residuo(): number {
    return this.y - MARGINE.basso;
  }

  nuovaPagina(): void {
    this.pagine.push([]);
    this.y = PAGINA.altezza - MARGINE.alto;
  }

  /** Se nella pagina non restano `altezza` punti, va a pagina nuova. */
  riserva(altezza: number): void {
    if (this.residuo < altezza) this.nuovaPagina();
  }

  spazio(altezza: number): void {
    // In cima a una pagina lo spazio prima di un blocco non serve.
    if (this.y >= PAGINA.altezza - MARGINE.alto - 0.5) return;
    this.y -= altezza;
  }

  /** Linea orizzontale sottile a tutta larghezza (o tra due x). */
  filetto(x1 = MARGINE.sx, x2 = PAGINA.larghezza - MARGINE.dx, grigio = 0.6, spessore = 0.5): void {
    this.ops.push(`q ${n(grigio)} G ${n(spessore)} w ${n(x1)} ${n(this.y)} m ${n(x2)} ${n(this.y)} l S Q`);
  }

  /** Scrive un paragrafo andando a capo da solo; cambia pagina quando serve. */
  paragrafo(tratti: Tratto[], opz: OpzioniParagrafo = {}): void {
    const corpo = opz.corpo ?? 10.5;
    const interlinea = opz.interlinea ?? corpo * 1.36;
    const allinea = opz.allinea ?? "giustificato";
    const rientro = opz.rientro ?? 0;
    const sporgenza = opz.sporgenza ?? 0;
    const spazioParola = (250 * corpo) / 1000;
    // Una parola più larga della riga (capita solo con stringhe senza spazi
    // lunghissime) viene spezzata, altrimenti uscirebbe dal margine.
    const maxAtomo = LARGHEZZA_TESTO - rientro - sporgenza;
    const pezzi = atomi(tratti, corpo).flatMap((a) =>
      a.larghezza <= maxAtomo ? [a] : spezza(a, maxAtomo, corpo),
    );
    if (pezzi.length === 0) return;

    // Divide in righe: si va a capo solo dove c'è uno spazio.
    const righe: Atomo[][] = [];
    let riga: Atomo[] = [];
    let larga = 0;
    const maxRiga = () => LARGHEZZA_TESTO - rientro - (righe.length > 0 ? sporgenza : 0);
    let i = 0;
    while (i < pezzi.length) {
      // Una "parola" è una sequenza di pezzi attaccati (es. grassetto + due punti).
      let j = i + 1;
      let parolaLarga = pezzi[i].larghezza;
      while (j < pezzi.length && !pezzi[j].spazioPrima) {
        parolaLarga += pezzi[j].larghezza;
        j++;
      }
      const conSpazio = riga.length > 0 ? spazioParola : 0;
      if (riga.length > 0 && larga + conSpazio + parolaLarga > maxRiga()) {
        righe.push(riga);
        riga = [];
        larga = 0;
      }
      if (riga.length > 0) larga += spazioParola;
      for (let k = i; k < j; k++) riga.push(pezzi[k]);
      larga += parolaLarga;
      i = j;
    }
    if (riga.length > 0) righe.push(riga);

    righe.forEach((r, idx) => {
      if (this.residuo < interlinea) this.nuovaPagina();
      this.y -= interlinea;
      const max = LARGHEZZA_TESTO - rientro - (idx > 0 ? sporgenza : 0);
      const spazi = r.filter((a, k) => k > 0 && a.spazioPrima).length;
      const naturale = r.reduce((s, a) => s + a.larghezza, 0) + spazi * spazioParola;
      const ultima = idx === righe.length - 1;

      let extra = 0;
      let x = MARGINE.sx + rientro + (idx > 0 ? sporgenza : 0);
      if (allinea === "centro") x += (max - naturale) / 2;
      else if (allinea === "giustificato" && !ultima && spazi > 0) {
        const e = (max - naturale) / spazi;
        // Una riga con buchi troppo larghi è più brutta di una riga non giustificata.
        if (e > 0 && e <= corpo * 0.9) extra = e;
      }
      this.scriviRiga(r, x, corpo, spazioParola, extra, opz.grigio ?? 0);
    });
    this.y -= opz.spazioDopo ?? 0;
  }

  /** Emette una riga: pezzi dello stesso stile vanno in un'unica stringa. */
  private scriviRiga(
    riga: Atomo[],
    x0: number,
    corpo: number,
    spazioParola: number,
    extra: number,
    grigio: number,
  ): void {
    let x = x0;
    let k = 0;
    const parti: string[] = [];
    while (k < riga.length) {
      const stile = riga[k].stile;
      if (k > 0 && riga[k].spazioPrima) x += spazioParola + extra;
      const inizio = x;
      let codici: number[] = [...riga[k].codici];
      x += riga[k].larghezza;
      k++;
      while (k < riga.length && riga[k].stile === stile) {
        if (riga[k].spazioPrima) {
          codici.push(32);
          x += spazioParola + extra;
        }
        codici = codici.concat(riga[k].codici);
        x += riga[k].larghezza;
        k++;
      }
      parti.push(
        `/${FONT[stile].id} ${n(corpo)} Tf ${n(extra)} Tw 1 0 0 1 ${n(inizio)} ${n(this.y)} Tm ${letterale(codici)} Tj`,
      );
    }
    this.ops.push(`BT ${n(grigio)} g ${parti.join(" ")} ET`);
  }

  /**
   * Riquadro della firma: etichetta, tratto disegnato (se c'è), riga e
   * didascalia. Resta tutto nella stessa pagina.
   */
  firma(etichetta: string, firma: Firma | null, didascalia: string): void {
    const altezzaBox = 56;
    const larghezzaBox = 230;
    this.riserva(18 + altezzaBox + 34);
    this.paragrafo([{ testo: etichetta, stile: "grassetto" }], { allinea: "sinistra", spazioDopo: 2 });

    const alto = this.y - 4;
    const basso = alto - altezzaBox;
    if (firma && firma.tratti.length > 0) {
      const scala = Math.min((larghezzaBox - 12) / firma.w, (altezzaBox - 8) / firma.h);
      const ox = MARGINE.sx + 6;
      const oy = alto - 4 - (altezzaBox - 8 - firma.h * scala) / 2;
      const cammino: string[] = [];
      for (const t of firma.tratti) {
        for (let i = 0; i < t.length; i += 2) {
          const px = ox + t[i] * scala;
          const py = oy - t[i + 1] * scala;
          cammino.push(`${n(px)} ${n(py)} ${i === 0 ? "m" : "l"}`);
        }
        if (firma.pieno) {
          cammino.push("h");
        } else {
          // Un tocco singolo: tratto lungo zero, che con la punta tonda è un puntino.
          if (t.length === 2) cammino.push(`${n(ox + t[0] * scala)} ${n(oy - t[1] * scala)} l`);
          cammino.push("S");
        }
      }
      this.ops.push(
        firma.pieno
          ? // Contorni chiusi riempiti con la regola pari-dispari (i buchi restano buchi).
            `q 0.05 0.07 0.25 rg ${cammino.join(" ")} f* Q`
          : `q 0.05 0.07 0.25 RG 1.1 w 1 J 1 j ${cammino.join(" ")} Q`,
      );
    }
    this.y = basso;
    this.filetto(MARGINE.sx, MARGINE.sx + larghezzaBox, 0.25, 0.6);
    this.y -= 2;
    if (didascalia) {
      this.paragrafo([{ testo: didascalia, stile: "corsivo" }], {
        corpo: 8.5,
        allinea: "sinistra",
        grigio: 0.3,
        spazioDopo: 10,
      });
    } else {
      this.y -= 14;
    }
  }

  /** Chiude il documento e restituisce i byte del file. */
  chiudi(): Uint8Array {
    const totale = this.pagine.length;
    const oggetti: string[] = [];
    const primaPagina = 7;

    const figli = this.pagine.map((_p, i) => `${primaPagina + i * 2} 0 R`).join(" ");
    oggetti[1] = "<< /Type /Catalog /Pages 2 0 R /Lang (it-IT) >>";
    oggetti[2] = `<< /Type /Pages /Kids [${figli}] /Count ${totale} >>`;
    (["normale", "grassetto", "corsivo"] as Stile[]).forEach((s, i) => {
      oggetti[3 + i] =
        `<< /Type /Font /Subtype /Type1 /BaseFont /${FONT[s].base} /Encoding /WinAnsiEncoding >>`;
    });
    const d = this.opzioni.data;
    const p2 = (v: number) => String(v).padStart(2, "0");
    const dataPdf =
      `D:${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}` +
      `${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}${p2(d.getUTCSeconds())}Z`;
    oggetti[6] =
      `<< /Title ${metadato(this.opzioni.titolo)} /Author ${metadato(this.opzioni.autore)} ` +
      `/Producer ${metadato("wesleycaicedo.com")} /CreationDate (${dataPdf}) /ModDate (${dataPdf}) >>`;

    this.pagine.forEach((ops, i) => {
      const yPiede = MARGINE.basso - 30;
      const piedeSx = letterale(codifica(this.opzioni.piede));
      const numero = `Pagina ${i + 1} di ${totale}`;
      const xNumero = PAGINA.larghezza - MARGINE.dx - larghezza(numero, "normale", 8);
      const piede =
        `q 0.75 G 0.4 w ${n(MARGINE.sx)} ${n(yPiede + 11)} m ${n(PAGINA.larghezza - MARGINE.dx)} ${n(yPiede + 11)} l S Q ` +
        `BT 0.4 g /F1 8 Tf 0 Tw 1 0 0 1 ${n(MARGINE.sx)} ${n(yPiede)} Tm ${piedeSx} Tj ` +
        `1 0 0 1 ${n(xNumero)} ${n(yPiede)} Tm ${letterale(codifica(numero))} Tj ET`;
      const flusso = [...ops, piede].join("\n");
      oggetti[primaPagina + i * 2] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(PAGINA.larghezza)} ${n(PAGINA.altezza)}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> /ProcSet [/PDF /Text] >> ` +
        `/Contents ${primaPagina + i * 2 + 1} 0 R >>`;
      oggetti[primaPagina + i * 2 + 1] = `<< /Length ${flusso.length} >>\nstream\n${flusso}\nendstream`;
    });

    // Assemblaggio: ogni carattere della stringa è un byte (tutto ASCII, tranne
    // la riga di commento iniziale che dichiara il file come binario).
    let file = "%PDF-1.4\n%âãÏÓ\n";
    const posizioni: number[] = [];
    for (let num = 1; num < oggetti.length; num++) {
      posizioni[num] = file.length;
      file += `${num} 0 obj\n${oggetti[num]}\nendobj\n`;
    }
    const inizioXref = file.length;
    file += `xref\n0 ${oggetti.length}\n0000000000 65535 f${" "}\n`;
    for (let num = 1; num < oggetti.length; num++) {
      file += `${String(posizioni[num]).padStart(10, "0")} 00000 n${" "}\n`;
    }
    const id = this.opzioni.id.replace(/[^0-9a-fA-F]/g, "").padEnd(32, "0").slice(0, 32).toUpperCase();
    file +=
      `trailer\n<< /Size ${oggetti.length} /Root 1 0 R /Info 6 0 R /ID [<${id}> <${id}>] >>\n` +
      `startxref\n${inizioXref}\n%%EOF\n`;

    const bytes = new Uint8Array(file.length);
    for (let i = 0; i < file.length; i++) bytes[i] = file.charCodeAt(i) & 0xff;
    return bytes;
  }
}
