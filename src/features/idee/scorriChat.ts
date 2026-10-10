/**
 * Porta in fondo la conversazione dopo un messaggio nuovo. Da md la chat ha altezza fissa e scorre
 * SOLO il suo contenitore ([data-chat-scroll]): scrollIntoView in Safari trascina anche gli antenati
 * (griglia con overflow hidden, finestra) e la conversazione finisce fuori vista. Sul telefono la
 * pagina non ha altezza fissa e il contenitore non scorre: scorre la finestra, così l'ultimo
 * messaggio resta sopra il composer incollato in basso.
 */
export function scorriChatInFondo(fine: HTMLElement | null) {
  const contenitore = fine?.closest<HTMLElement>("[data-chat-scroll]");
  if (!contenitore) {
    fine?.scrollIntoView({ behavior: "smooth", block: "end" });
    return;
  }
  if (contenitore.scrollHeight > contenitore.clientHeight) {
    contenitore.scrollTo({ top: contenitore.scrollHeight, behavior: "smooth" });
    return;
  }
  if (window.matchMedia("(max-width: 767.98px)").matches) {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  }
}
