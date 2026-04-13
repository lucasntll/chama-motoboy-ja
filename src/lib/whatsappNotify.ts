import { openWhatsApp } from "@/lib/whatsapp";

const APP_URL = "https://chama-motoboy-ja.lovable.app";

/** Build a reliable link that works from WhatsApp using query params */
function orderLink(orderId: string, target?: string): string {
  const params = new URLSearchParams({ pedido: orderId });
  if (target) params.set("to", target);
  return `${APP_URL}/?${params.toString()}`;
}

/**
 * Notify establishment about a new order via WhatsApp
 */
export function notifyEstablishmentNewOrder(
  estPhone: string,
  customerName: string,
  itemDescription: string,
  orderId: string
) {
  const msg = `🔔 *NOVO PEDIDO!*\n\n` +
    `👤 Cliente: ${customerName}\n` +
    `📦 Pedido: ${itemDescription}\n\n` +
    `👉 Acesse o painel para confirmar:\n${orderLink(orderId, "estabelecimento")}`;
  openWhatsApp(estPhone, msg);
}

/**
 * Notify client that the value has been defined
 */
export function notifyClientValueDefined(
  clientPhone: string,
  productValue: number,
  deliveryFee: number,
  orderId: string
) {
  const total = productValue + deliveryFee;
  const msg = `💰 *Valor do seu pedido definido!*\n\n` +
    `📦 Produtos: R$ ${productValue.toFixed(2)}\n` +
    `🛵 Frete: R$ ${deliveryFee.toFixed(2)}\n` +
    `💵 *Total: R$ ${total.toFixed(2)}*\n\n` +
    `👉 Confirme aqui:\n${orderLink(orderId)}`;
  openWhatsApp(clientPhone, msg);
}

/**
 * Notify client that the order has been confirmed and is being prepared
 */
export function notifyClientOrderConfirmed(
  clientPhone: string,
  orderId: string
) {
  const msg = `✅ *Pedido confirmado!*\n\n` +
    `Seu pedido está sendo preparado.\n\n` +
    `👉 Acompanhe:\n${orderLink(orderId)}`;
  openWhatsApp(clientPhone, msg);
}

/**
 * Notify client that a motoboy accepted the order
 */
export function notifyClientMotoboyAccepted(
  clientPhone: string,
  motoboyName: string,
  orderId: string
) {
  const msg = `🏍️ *Motoboy a caminho!*\n\n` +
    `${motoboyName} aceitou sua entrega.\n\n` +
    `👉 Acompanhe em tempo real:\n${orderLink(orderId)}`;
  openWhatsApp(clientPhone, msg);
}

/**
 * Notify available motoboys about a ready order
 */
export function notifyMotoboyNewRide(
  motoboyPhone: string,
  itemDescription: string,
  deliveryAddress: string
) {
  const msg = `🚀 *Nova corrida disponível!*\n\n` +
    `📦 ${itemDescription}\n` +
    `📍 ${deliveryAddress}\n\n` +
    `👉 Acesse o painel:\n${APP_URL}/?to=motoboy`;
  openWhatsApp(motoboyPhone, msg);
}
