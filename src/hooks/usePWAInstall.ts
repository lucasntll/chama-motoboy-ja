import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "pwa_install_dismissed_at";
const SESSION_KEY = "pwa_install_shown_this_session";
const VISIT_COUNT_KEY = "pwa_visit_count";
const DISMISS_COOLDOWN_DAYS = 3;

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canShow, setCanShow] = useState(false);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || (navigator as any).standalone === true;

  useEffect(() => {
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Track visit count
    const visits = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(visits));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isStandalone]);

  const shouldShowPrompt = useCallback((trigger: "order" | "visit") => {
    if (isInstalled || isStandalone) return false;

    // Already shown this session
    if (sessionStorage.getItem(SESSION_KEY)) return false;

    // Cooldown check
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_COOLDOWN_DAYS) return false;
    }

    if (trigger === "order") return true;

    // Show on 2nd+ visit
    const visits = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10);
    return visits >= 2;
  }, [isInstalled, isStandalone]);

  const triggerShow = useCallback((trigger: "order" | "visit") => {
    if (shouldShowPrompt(trigger)) {
      setCanShow(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }
  }, [shouldShowPrompt]);

  const installNative = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setIsInstalled(true);
      setCanShow(false);
    }
    return outcome === "accepted";
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setCanShow(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }, []);

  return {
    canShow,
    isIOS,
    isAndroid,
    isInstalled,
    hasNativePrompt: !!deferredPrompt,
    triggerShow,
    installNative,
    dismiss,
  };
};
