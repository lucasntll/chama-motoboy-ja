/**
 * Opens WhatsApp externally, avoiding iframe/webview issues.
 * Uses window.open first, falls back to location.href if blocked.
 */
export function openWhatsApp(phone: string, message?: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const base = `https://api.whatsapp.com/send?phone=${cleanPhone}`;
  const url = message ? `${base}&text=${encodeURIComponent(message)}` : base;

  // Try window.open first
  const win = window.open(url, "_blank", "noopener,noreferrer");

  // If popup was blocked (returns null), fallback to direct navigation
  if (!win) {
    window.location.href = url;
  }
}

/**
 * Builds a WhatsApp URL for use in <a> tags.
 */
export function whatsappUrl(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const base = `https://api.whatsapp.com/send?phone=${cleanPhone}`;
  return message ? `${base}&text=${encodeURIComponent(message)}` : base;
}
