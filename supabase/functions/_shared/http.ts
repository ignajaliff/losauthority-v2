export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

/** Risposta JSON con CORS. */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Errore JSON: { ok:false, error } — messaggio per l'utente, mai stack interni. */
export function errore(message: string, status = 400): Response {
  return json({ ok: false, error: message }, status);
}

/** Preflight CORS: da chiamare per prima cosa nel serve. */
export function preflight(req: Request): Response | null {
  return req.method === "OPTIONS" ? new Response("ok", { headers: corsHeaders }) : null;
}

/** Body JSON tollerante (body vuoto → {}). */
export async function leggiBody<T extends Record<string, unknown>>(req: Request): Promise<T> {
  try {
    const txt = await req.text();
    if (!txt.trim()) return {} as T;
    return JSON.parse(txt) as T;
  } catch {
    return {} as T;
  }
}

/** Errore-Response lanciabile: `throw rifiuta(403, "…")` dentro gli helper di auth. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Converte un HttpError (o qualsiasi errore) in Response. */
export function gestisciErrore(err: unknown): Response {
  if (err instanceof HttpError) return errore(err.message, err.status);
  console.error(err);
  return errore("Errore interno. Riprova tra poco.", 500);
}
