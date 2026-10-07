import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

/**
 * Dopo un nuovo deploy i chunk vecchi non esistono più: una scheda aperta da prima fallisce al primo
 * cambio di pagina. Vite lo segnala con `vite:preloadError`: si ricarica una volta per prendere la
 * versione nuova (al massimo una ricarica ogni 10 s; al secondo errore si vede l'ErrorBoundary).
 */
window.addEventListener("vite:preloadError", (evento) => {
  try {
    const ultima = Number(sessionStorage.getItem("ricarica-chunk") ?? 0);
    if (Date.now() - ultima < 10_000) return;
    sessionStorage.setItem("ricarica-chunk", String(Date.now()));
  } catch {
    return;
  }
  evento.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
