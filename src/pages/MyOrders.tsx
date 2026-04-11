import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Package, Filter, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";

type StatusFilter = "all" | "active" | "completed";

const STATUS_LABELS: Record<string, { label: string; emoji: string; group: "active" | "completed" }> = {
  queued: { label: "Na fila de espera", emoji: "⏳", group: "active" },
  pending: { label: "Procurando motoboy", emoji: "🔍", group: "active" },
  accepted: { label: "Motoboy a caminho", emoji: "🏍️", group: "active" },
  picking_up: { label: "Buscando pedido", emoji: "🛒", group: "active" },
  delivering: { label: "Saiu para entrega", emoji: "🛵", group: "active" },
  completed: { label: "Entregue", emoji: "✅", group: "completed" },
  cancelled: { label: "Cancelado", emoji: "❌", group: "completed" },
};

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("dismissed_orders") || "[]"); } catch { return []; }
  });

  const dismissOrder = (orderId: string) => {
    const next = [...dismissed, orderId];
    setDismissed(next);
    localStorage.setItem("dismissed_orders", JSON.stringify(next));
  };

  const clearFinished = () => {
    const finishedIds = orders
      .filter(o => o.status === "completed" || o.status === "cancelled")
      .map(o => o.id);
    const next = [...new Set([...dismissed, ...finishedIds])];
    setDismissed(next);
    localStorage.setItem("dismissed_orders", JSON.stringify(next));
  };
  const fetchOrders = async () => {
    const phone = localStorage.getItem("client_phone");
    if (!phone) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const phone = localStorage.getItem("client_phone");
    if (!phone) return;
    const channel = supabase
      .channel("my-orders-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = orders
    .filter((o) => !dismissed.includes(o.id))
    .filter((o) => {
      if (filter === "all") return true;
      const s = STATUS_LABELS[o.status];
      if (!s) return filter === "active";
      return s.group === (filter === "active" ? "active" : "completed");
    });

  const hasFinished = orders.some(o => 
    (o.status === "completed" || o.status === "cancelled") && !dismissed.includes(o.id)
  );

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Em andamento" },
    { key: "completed", label: "Finalizados" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate("/")} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Meus Pedidos</h1>
      </header>

      <div className="flex gap-2 px-4 py-3">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
              filter === f.key
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card border text-foreground hover:bg-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <main className="flex-1 px-4 py-2 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Package className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              {filter === "all" ? "Nenhum pedido ainda" : "Nenhum pedido nessa categoria"}
            </p>
            <button
              onClick={() => navigate("/cliente")}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground active:scale-[0.97]"
            >
              Fazer primeiro pedido
            </button>
          </div>
        ) : (
          filtered.map((order, i) => {
            const s = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
            const date = new Date(order.created_at);
            return (
              <button
                key={order.id}
                onClick={() => navigate(`/acompanhar/${order.id}`)}
                className="flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all active:scale-[0.98] hover:shadow-md animate-fade-in-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <span className="text-2xl">{s.emoji}</span>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-bold truncate">{order.item_description}</p>
                  <p className="text-xs text-muted-foreground truncate">{order.delivery_address}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{s.label}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {date.toLocaleDateString("pt-BR")} {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/40 shrink-0" />
              </button>
            );
          })
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default MyOrders;
