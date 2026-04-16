import { useEffect, useRef } from "react";

/**
 * Re-runs `refetch` whenever the app returns from background:
 * - tab becomes visible again (visibilitychange)
 * - window regains focus
 * - device comes back online
 *
 * Includes a small debounce so we don't double-fire when both events happen.
 */
export function useRefetchOnFocus(refetch: () => void | Promise<void>, enabled: boolean = true) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!enabled) return;

    let lastRun = 0;
    const run = (reason: string) => {
      const now = Date.now();
      if (now - lastRun < 800) return; // debounce
      lastRun = now;
      console.log(`[Sync] Refetch triggered by: ${reason}`);
      try {
        refetchRef.current();
      } catch (e) {
        console.error("[Sync] Refetch error:", e);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") run("visibilitychange");
    };
    const onFocus = () => run("focus");
    const onOnline = () => run("online");
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) run("pageshow-bfcache");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [enabled]);
}
