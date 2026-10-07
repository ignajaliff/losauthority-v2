import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";
import type { Firma } from "@contratti/tipi.ts";

/** Lo spazio logico della firma: i tratti sono salvati in queste coordinate. */
const LARGO = 600;
const ALTO = 200;
const SPESSORE = 2.6;
const MAX_PUNTI = 6000;
const INCHIOSTRO = "#0c1140";

interface FirmaPadProps {
  onChange: (firma: Firma | null) => void;
  etichetta?: string;
  disabled?: boolean;
}

/**
 * Riquadro in cui si firma col dito, con la penna o col mouse.
 * Registra SOLO la forma del tratto (niente tempi né pressione): è quello che
 * promette l'informativa privacy.
 */
export function FirmaPad({ onChange, etichetta = "Firma qui", disabled = false }: FirmaPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tratti = useRef<number[][]>([]);
  const inCorso = useRef<number[] | null>(null);
  const [vuoto, setVuoto] = useState(true);

  const ridisegna = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.setTransform(w / LARGO, 0, 0, h / ALTO, 0, 0);
    ctx.lineWidth = SPESSORE;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = INCHIOSTRO;
    for (const t of tratti.current) {
      ctx.beginPath();
      ctx.moveTo(t[0], t[1]);
      for (let i = 2; i < t.length; i += 2) ctx.lineTo(t[i], t[i + 1]);
      if (t.length === 2) ctx.lineTo(t[0], t[1]);
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    ridisegna();
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    // Se il riquadro cambia misura (telefono girato) si ridisegna dai tratti salvati.
    const ro = new ResizeObserver(() => ridisegna());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [ridisegna]);

  const emetti = useCallback(() => {
    const lista = tratti.current;
    setVuoto(lista.length === 0);
    onChange(lista.length === 0 ? null : { w: LARGO, h: ALTO, tratti: lista.map((t) => [...t]) });
  }, [onChange]);

  function punto(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * LARGO;
    const y = ((e.clientY - rect.top) / rect.height) * ALTO;
    return [Math.round(Math.min(Math.max(x, 0), LARGO) * 10) / 10, Math.round(Math.min(Math.max(y, 0), ALTO) * 10) / 10];
  }

  function giu(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = punto(e);
    inCorso.current = [x, y];
    tratti.current.push(inCorso.current);
    ridisegna();
  }

  function muovi(e: React.PointerEvent<HTMLCanvasElement>) {
    const t = inCorso.current;
    if (!t) return;
    e.preventDefault();
    const totale = tratti.current.reduce((s, tr) => s + tr.length / 2, 0);
    if (totale >= MAX_PUNTI) return;
    const [x, y] = punto(e);
    const px = t[t.length - 2];
    const py = t[t.length - 1];
    if (Math.hypot(x - px, y - py) < 1.2) return;
    t.push(x, y);
    // Solo l'ultimo segmento: ridisegnare tutto a ogni movimento rallenta i telefoni.
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function su(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!inCorso.current) return;
    e.preventDefault();
    inCorso.current = null;
    emetti();
  }

  function cancella() {
    tratti.current = [];
    inCorso.current = null;
    ridisegna();
    emetti();
  }

  return (
    <div className="grid gap-1.5">
      <div className={cn("relative overflow-hidden rounded-md border border-input", disabled ? "bg-muted/40" : "bg-card")}>
        <canvas
          ref={canvasRef}
          onPointerDown={giu}
          onPointerMove={muovi}
          onPointerUp={su}
          onPointerCancel={su}
          aria-label={etichetta}
          className={cn("block w-full", disabled ? "cursor-not-allowed" : "cursor-crosshair")}
          // Senza touch-action: none il telefono scorre la pagina invece di tracciare la firma.
          style={{ aspectRatio: `${LARGO} / ${ALTO}`, touchAction: "none" }}
        />
        {vuoto ? (
          <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            {etichetta}
          </span>
        ) : null}
        <span aria-hidden className="pointer-events-none absolute right-[6%] bottom-[22%] left-[6%] border-b border-dashed border-input" />
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={cancella} disabled={disabled || vuoto}>
          Cancella e rifai
        </Button>
      </div>
    </div>
  );
}
