// Passo 1 · Utenti auth: vecchio auth.users + profiles.role → nuovo auth.users (+ user_roles via trigger).
import { leggiTutto, listaUtenti, passwordCasuale } from "./comune.mjs";

const RUOLI = new Set(["admin", "cliente", "staff", "staff_fatture"]);

export async function migraUtenti(ctx) {
  const { old, nuovo, report } = ctx;
  const vecchi = await listaUtenti(old);
  const profili = await leggiTutto(old, "profiles", { select: "id, role, full_name, email" });
  const profiloPer = new Map(profili.map((p) => [p.id, p]));
  const nuoviPerEmail = new Map((await listaUtenti(nuovo)).map((u) => [u.email?.toLowerCase(), u]));
  report.conta("utenti", "vecchio", vecchi.length);

  for (const u of vecchi) {
    const email = (u.email ?? profiloPer.get(u.id)?.email ?? "").toLowerCase();
    if (!email) {
      report.salta("utenti", u.id, "utente senza email");
      continue;
    }
    const profilo = profiloPer.get(u.id);
    const ruolo = RUOLI.has(profilo?.role) ? profilo.role : "cliente";
    if (!profilo) report.nota(`Utente ${email} senza riga profiles nel vecchio: migrato come cliente`);
    const nome = profilo?.full_name || u.user_metadata?.full_name || email;
    ctx.ruoli.set(u.id, ruolo);

    const esistente = nuoviPerEmail.get(email);
    if (esistente) {
      report.nota(`Utente ${email} già presente nel nuovo progetto: riuso id ${esistente.id}`);
      ctx.mappa.set(u.id, esistente.id);
      report.conta("utenti", "nuovo");
      if (ctx.esegui) await allineaRuolo(ctx, esistente.id, ruolo, email);
      continue;
    }
    if (!ctx.esegui) {
      ctx.mappa.set(u.id, null);
      report.conta("utenti", "nuovo");
      continue;
    }
    const password = passwordCasuale();
    const { data, error } = await nuovo.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: { nombre: nome },
    });
    if (error || !data?.user) {
      report.salta("utenti", email, error?.message ?? "createUser senza utente");
      continue;
    }
    ctx.mappa.set(u.id, data.user.id);
    report.aggiungiPassword(email, password);
    report.conta("utenti", "nuovo");
    await allineaRuolo(ctx, data.user.id, ruolo, email);
  }
}

/** Il trigger crea admin (allowlist) o cliente: per staff/admin fuori allowlist aggiorna il ruolo e rimuove clienti. */
async function allineaRuolo(ctx, id, ruolo, email) {
  const { nuovo, report } = ctx;
  const { data: attuale, error } = await nuovo.from("user_roles").select("rol").eq("id", id).maybeSingle();
  if (error) {
    report.salta("user_roles", email, `lettura ruolo: ${error.message}`);
    return;
  }
  if (!attuale) {
    report.salta("user_roles", email, "riga user_roles assente (trigger non eseguito?)");
    return;
  }
  if (ruolo === "cliente") {
    if (attuale.rol !== "cliente") report.nota(`Utente ${email}: era cliente nel vecchio ma nel nuovo è ${attuale.rol} (allowlist admin?)`);
    return;
  }
  if (attuale.rol !== ruolo) {
    const { error: e1 } = await nuovo.from("user_roles").update({ rol: ruolo }).eq("id", id);
    if (e1) {
      report.salta("user_roles", email, `update rol: ${e1.message}`);
      return;
    }
  }
  const { error: e2 } = await nuovo.from("clienti").delete().eq("id", id);
  if (e2) report.salta("user_roles", email, `delete clienti per ${ruolo}: ${e2.message}`);
}
