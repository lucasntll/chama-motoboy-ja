/**
 * Local push notifications via Despia SDK.
 * Only fires if the user has granted notification permission.
 */

function isNotificationEnabled(): boolean {
  return typeof Notification !== "undefined" && Notification.permission === "granted";
}

function sendLocalPush(title: string, message: string, url: string, delaySec = 0): void {
  if (!isNotificationEnabled()) return;

  try {
    // @ts-ignore — Despia SDK global
    const despia = (window as any).despia;
    if (typeof despia === "function") {
      despia(`sendlocalpushmsg://push.send?s=${delaySec}=msg!${message}&!#${title}&!#${url}`);
      return;
    }
  } catch {
    // Despia not available, fall through to native
  }

  // Fallback: browser Notification API
  if (delaySec > 0) {
    setTimeout(() => showNativeNotification(title, message, url), delaySec * 1000);
  } else {
    showNativeNotification(title, message, url);
  }
}

function showNativeNotification(title: string, body: string, url: string) {
  try {
    const n = new Notification(title, { body, icon: "/favicon.ico", tag: url });
    n.onclick = () => { window.focus(); window.location.href = url; };
  } catch {
    // silent
  }
}

// ---------- Event triggers ----------

const sent = new Set<string>();

function once(key: string, fn: () => void) {
  if (sent.has(key)) return;
  sent.add(key);
  fn();
  // Allow re-send after 60s to avoid permanent block
  setTimeout(() => sent.delete(key), 60_000);
}

export function notifyOrderCreated(orderId: string) {
  once(`order-created-${orderId}`, () =>
    sendLocalPush(
      "Novo pedido realizado",
      "Seu pedido foi recebido com sucesso e já está sendo processado.",
      `/acompanhar/${orderId}`,
    ),
  );
}

export function notifyMotoboyOutForDelivery(orderId: string) {
  once(`out-delivery-${orderId}`, () =>
    sendLocalPush(
      "Motoboy saiu para entrega",
      "Seu pedido já saiu para entrega e está a caminho.",
      `/acompanhar/${orderId}`,
    ),
  );
}

export function notifyMotoboyArrived(orderId: string) {
  once(`arrived-${orderId}`, () =>
    sendLocalPush(
      "Motoboy chegou",
      "O motoboy chegou ao local da entrega. Confira seu pedido.",
      `/acompanhar/${orderId}`,
    ),
  );
}
