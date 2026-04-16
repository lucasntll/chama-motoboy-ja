/**
 * Platform detection utilities for push notification compatibility.
 * iOS requires PWA installed (standalone) + iOS 16.4+ for Web Push.
 * Android works in Chrome/Edge with or without PWA.
 */

export type Platform = "ios" | "android" | "desktop" | "other";

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Macintosh|Windows|Linux/i.test(ua)) return "desktop";
  return "other";
}

export function isStandalonePWA(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true ||
    document.referrer.startsWith("android-app://")
  );
}

/** iOS version (major number) or null when not iOS. */
export function getIOSVersion(): number | null {
  const match = navigator.userAgent.match(/OS (\d+)_/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Whether the device CAN receive web push at all.
 * - Android: any modern browser
 * - iOS: 16.4+ AND installed as PWA (standalone)
 */
export function canReceivePush(): { ok: boolean; reason?: string } {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "browser-unsupported" };
  }

  const platform = detectPlatform();

  if (platform === "ios") {
    const version = getIOSVersion();
    if (version !== null && version < 16) {
      return { ok: false, reason: "ios-too-old" };
    }
    if (!isStandalonePWA()) {
      return { ok: false, reason: "ios-needs-install" };
    }
  }

  return { ok: true };
}
