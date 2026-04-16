import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  notifyMotoboyAccepted,
  notifyMotoboyOutForDelivery,
  notifyOrderDelivered,
  isNotificationEnabled,
} from "@/lib/despiaNotifications";

/**
 * Hook that listens to realtime order updates for the current client device.
 * Triggers Despia local push notifications when order status changes.
 * Should be mounted in a persistent component (e.g. App-level or layout).
 */
export function useClientOrderNotifications() {
  const prevStatuses = useRef<Record<string, string>>({});

  useEffect(() => {
    const clientPhone = localStorage.getItem("client_phone");
    if (!clientPhone) return;

    console.log("[Despia] Client realtime listener started for phone:", clientPhone.slice(-4));

    const channel = supabase
      .channel("client-order-notifications")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
      }, (payload) => {
        const row = payload.new as any;
        if (!row || !row.id) return;

        // Only process orders belonging to this client
        const orderPhone = (row.customer_phone || "").replace(/\D/g, "");
        if (!orderPhone.endsWith(clientPhone.slice(-8))) return;

        if (!isNotificationEnabled()) {
          console.log("[Despia] Realtime event received but notifications disabled");
          return;
        }

        const prevStatus = prevStatuses.current[row.id];
        const newStatus = row.status;

        if (prevStatus === newStatus) return;
        prevStatuses.current[row.id] = newStatus;

        console.log(`[Despia] Realtime: order ${row.id} status ${prevStatus} -> ${newStatus}`);

        switch (newStatus) {
          case "accepted":
            notifyMotoboyAccepted(row.id);
            break;
          case "delivering":
            notifyMotoboyOutForDelivery(row.id);
            break;
          case "completed":
            notifyOrderDelivered(row.id);
            break;
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
