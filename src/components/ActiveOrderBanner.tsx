import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ChevronRight, Package, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { playIPhoneDing } from "@/lib/notifications";
import { toast } from "sonner";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";

const STATUS_LABELS: Record<string, { label: string; emoji: string }> = {
  queued: { label: "Na fila de espera", emoji: "⏳" },
  pending: { label: "Procurando motoboy...", emoji: "🔍" },
  accepted: { label: "Motoboy a caminho!", emoji: "🏍️" },
  picking_up: { label: "Buscando seu pedido", emoji: "🛒" },
  delivering: { label: "Saiu para entrega!", emoji: "🛵" },
  completed: { label: "Entregue!", emoji: "✅" },
  cancelled: { label: "Cancelado", emoji: "❌" },
};

const ActiveOrderBanner = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [prevStatuses, setPrevStatuses] = useState<Record<string, string>>({});
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("dismissed_orders") || "[]"); } catch { return []; }
  });

  const dismissOrder = useCallback((orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = [...dismissed, orderId];
    setDismissed(next);
    localStorage.setItem("dismissed_orders", JSON.stringify(next));
  }, [dismissed]);

  const dismissAllCompleted = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const completedIds = orders.filter(o => o.status === "completed" || o.status === "cancelled").map(o => o.id);
    const next = [...new Set([...dismissed, ...completedIds])];
    setDismissed(next);
    localStorage.setItem("dismissed_orders", JSON.stringify(next));
  }, [dismissed, orders]);

  const fetchOrders = async () => {
    const phone = localStorage.getItem("client_phone");
    if (!phone) return;

    const { data } = await supabase
      .from("orders")
      .select("id, item_description, status, created_at")
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      // Check for status transitions that trigger notifications
      data.forEach((order) => {
        const prev = prevStatuses[order.id];
        if (prev && prev !== order.status) {
          if (order.status === "accepted") {
            playIPhoneDing();
            toast("🚀 Seu pedido foi aceito por um motoboy!", { duration: 6000 });
          } else if (order.status === "delivering") {
            playIPhoneDing();
            toast("🛵 Seu pedido saiu para entrega!", { duration: 6000 });
          }
        }
      });

      const newStatuses: Record<string, string> = {};
      data.forEach((o) => (newStatuses[o.id] = o.status));
      setPrevStatuses(newStatuses);
      setOrders(data);
    }
  };

  useEffect(() => {
    fetchOrders();
    const phone = localStorage.getItem("client_phone");
    if (!phone) return;

    const channel = supabase
      .channel("client-orders-banner")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `customer_phone=eq.${phone}`,
      }, () => fetchOrders())
      .subscribe();

    // Reduced polling from 15s to 60s (realtime handles most updates)
    const interval = setInterval(fetchOrders, 60000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const activeOrders = orders.filter((o) =>
    ["queued", "pending", "accepted", "picking_up", "delivering"].includes(o.status)
  );
  const recentCompleted = orders
    .filter((o) => o.status === "completed" && !dismissed.includes(o.id))
    .slice(0, 2);

  if (activeOrders.length === 0 && recentCompleted.length === 0) return null;

  return (
    <div className="w-full max-w-sm space-y-3">
      <h3 className="text-sm font-bold text-primary-foreground/90 uppercase tracking-wide">
        Seus pedidos
      </h3>

      {activeOrders.map((order) => {
        const s = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
        return (
          <button
            key={order.id}
            onClick={() => navigate(`/acompanhar/${order.id}`)}
            className="flex w-full items-center gap-3 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 px-4 py-3.5 text-left transition-all active:scale-[0.97] hover:bg-primary-foreground/20"
          >
            <span className="text-2xl">{s.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary-foreground truncate">
                {order.item_description}
              </p>
              <div className="flex items-center gap-1.5">
                {["queued", "pending"].includes(order.status) && (
                  <Loader2 className="h-3 w-3 animate-spin text-primary-foreground/70" />
                )}
                <p className="text-xs text-primary-foreground/70">{s.label}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-primary-foreground/50 shrink-0" />
          </button>
        );
      })}

      {recentCompleted.length > 0 && activeOrders.length === 0 && (
        <div className="space-y-2">
          {recentCompleted.map((order) => (
            <div key={order.id} className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/acompanhar/${order.id}`)}
                className="flex flex-1 items-center gap-3 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/10 px-4 py-3 text-left transition-all active:scale-[0.97]"
              >
                <span className="text-xl">✅</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary-foreground/80 truncate">
                    {order.item_description}
                  </p>
                  <p className="text-xs text-primary-foreground/50">Entregue</p>
                </div>
                <ChevronRight className="h-4 w-4 text-primary-foreground/30 shrink-0" />
              </button>
              <button
                onClick={(e) => dismissOrder(order.id, e)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground/50 hover:bg-destructive/20 hover:text-destructive transition-all active:scale-90"
                title="Remover"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {recentCompleted.length > 1 && (
            <button
              onClick={dismissAllCompleted}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-primary-foreground/50 hover:text-primary-foreground/70 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Limpar entregues
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => navigate("/meus-pedidos")}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-primary-foreground/60 hover:text-primary-foreground/80 transition-colors"
      >
        <Package className="h-3.5 w-3.5" />
        Ver todos os pedidos
      </button>
    </div>
  );
};

export default ActiveOrderBanner;
