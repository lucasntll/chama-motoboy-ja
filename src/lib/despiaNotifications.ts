/**
 * Local push notifications via Despia SDK.
 * Only fires if the user has granted notification permission.
 */

const NOTIF_ENABLED_KEY = "despia_notifications_enabled";

/** Check if notifications are enabled (user preference + browser permission). */
export function isNotificationEnabled(): boolean {
  // User-level opt-out stored in localStorage
  const pref = localStorage.getItem(NOTIF_ENABLED_KEY);
  if (pref === "false") {
    console.log("[Despia] Notifications disabled by user preference");
    return false;
  }
  // Browser-level permission
  if (typeof Notification !== "undefined" && Notification.permission === "denied") {
    console.log("[Despia] Notifications blocked by browser");
    return false;
  }
  return true;
}

/** Enable or disable notifications (user preference). */
export function setNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIF_ENABLED_KEY, String(enabled));
  console.log(`[Despia] Notifications ${enabled ? "enabled" : "disabled"} by user`);
}

/** Get current user preference. */
export function getNotificationsEnabled(): boolean {
  const pref = localStorage.getItem(NOTIF_ENABLED_KEY);
  return pref !== "false";
}

function sendLocalPush(title: string, message: string, url: string, delaySec = 1): void {
  if (!isNotificationEnabled()) {
    console.log("[Despia] Skipped — notifications not enabled");
    return;
  }

  try {
    // @ts-ignore — Despia SDK global
    const despia = (window as any).despia;
    if (typeof despia === "function") {
      const pushUrl = `sendlocalpushmsg://push.send?s=${delaySec}=msg!${message}&!#${title}&!#${url}`;
      console.log("[Despia] Sending local push:", pushUrl);
      despia(pushUrl);
      return;
    }
  } catch (err) {
    console.warn("[Despia] SDK not available, falling back to native:", err);
  }

  // Fallback: browser Notification API
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    const show = () => {
      try {
        const n = new Notification(title, { body: message, icon: "/icon-512.png", tag: `${title}-${url}` });
        n.onclick = () => { window.focus(); window.location.href = url; };
        console.log("[Despia] Native notification shown:", title);
      } catch (err) {
        console.warn("[Despia] Native notification error:", err);
      }
    };
    if (delaySec > 0) {
      setTimeout(show, delaySec * 1000);
    } else {
      show();
    }
  } else {
    console.log("[Despia] No notification method available");
  }
}

// ---------- Deduplication ----------

const sent = new Set<string>();

function once(key: string, fn: () => void) {
  if (sent.has(key)) {
    console.log("[Despia] Skipped duplicate:", key);
    return;
  }
  sent.add(key);
  fn();
  // Allow re-send after 60s to avoid permanent block
  setTimeout(() => sent.delete(key), 60_000);
}

// ---------- Customer-side notifications ----------

export function notifyOrderCreated(orderId: string) {
  once(`order-created-${orderId}`, () => {
    console.log("[Despia] Triggering: order created for customer", orderId);
    sendLocalPush(
      "Novo pedido realizado",
      "Seu pedido foi recebido com sucesso e já está sendo preparado.",
      `/acompanhar/${orderId}`,
    );
  });
}

export function notifyMotoboyAccepted(orderId: string) {
  once(`motoboy-accepted-${orderId}`, () => {
    console.log("[Despia] Triggering: motoboy accepted", orderId);
    sendLocalPush(
      "Motoboy aceitou seu pedido",
      "Seu pedido já foi aceito por um motoboy e logo sairá para entrega.",
      `/acompanhar/${orderId}`,
    );
  });
}

export function notifyMotoboyOutForDelivery(orderId: string) {
  once(`out-delivery-${orderId}`, () => {
    console.log("[Despia] Triggering: out for delivery", orderId);
    sendLocalPush(
      "Motoboy saiu para entrega",
      "Seu pedido já saiu para entrega e está a caminho.",
      `/acompanhar/${orderId}`,
    );
  });
}

export function notifyMotoboyArrived(orderId: string) {
  once(`arrived-${orderId}`, () => {
    console.log("[Despia] Triggering: motoboy arrived", orderId);
    sendLocalPush(
      "Motoboy chegou",
      "O motoboy chegou ao local da entrega. Confira seu pedido.",
      `/acompanhar/${orderId}`,
    );
  });
}

export function notifyOrderDelivered(orderId: string) {
  once(`delivered-${orderId}`, () => {
    console.log("[Despia] Triggering: order delivered", orderId);
    sendLocalPush(
      "Pedido entregue",
      "Seu pedido foi entregue com sucesso. Obrigado pela preferência.",
      `/acompanhar/${orderId}`,
    );
  });
}

// ---------- Courier-side notifications ----------

export function notifyNewOrderForCourier(orderId: string) {
  once(`new-order-courier-${orderId}`, () => {
    console.log("[Despia] Triggering: new order available for courier", orderId);
    sendLocalPush(
      "Novo pedido disponível",
      "Um novo pedido está disponível para entrega.",
      `/motoboy`,
    );
  });
}

// ---------- Test notification ----------

export function sendTestNotification() {
  console.log("[Despia] Sending test notification");
  sendLocalPush(
    "🛵 Teste ChamaMoto",
    "Suas notificações estão funcionando!",
    "/",
    0,
  );
}
