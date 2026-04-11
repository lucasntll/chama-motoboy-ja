import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store, LogOut, Bell, Package, Clock, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { playIPhoneDing } from "@/lib/notifications";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  item_description: string;
  house_reference: string;
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  preparing: { label: "Em preparo", icon: <Clock className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-800" },
  ready: { label: "Pronto p/ retirada", icon: <CheckCircle className="h-4 w-4" />, color: "bg-green-100 text-green-800" },
  in_transit: { label: "Em entrega", icon: <Package className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
  completed: { label: "Finalizado", icon: <CheckCircle className="h-4 w-4" />, color: "bg-gray-100 text-gray-600" },
};

const EstablishmentDashboard = () => {
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const estId = localStorage.getItem("establishment_id");
  const estName = localStorage.getItem("establishment_name");

  useEffect(() => {
    if (!estId) {
      navigate("/estabelecimento-acesso", { replace: true });
      return;
    }
    loadData();
    const channel = supabase
      .channel("est-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `establishment_id=eq.${estId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          playIPhoneDing();
          toast("🔔 Novo pedido recebido!", { duration: 5000 });
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
        loadOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: est } = await supabase.from("establishments").select("*").eq("id", estId!).single();
    if (est) {
      setEstablishment(est);
      setIsOpen((est as any).is_open);
    }
    await loadOrders();
    setLoading(false);
  };

  const loadOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("establishment_id", estId!)
      .in("status", ["preparing", "ready", "in_transit", "pending"])
      .order("created_at", { ascending: false });
    setOrders((data || []) as Order[]);
  };

  const toggleOpen = async () => {
    const newVal = !isOpen;
    await supabase.from("establishments").update({ is_open: newVal } as any).eq("id", estId!);
    setIsOpen(newVal);
    toast.success(newVal ? "Estabelecimento ABERTO!" : "Estabelecimento FECHADO");
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    toast.success("Status atualizado!");
    loadOrders();
  };

  const handleLogout = () => {
    localStorage.removeItem("establishment_id");
    localStorage.removeItem("establishment_name");
    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status !== "completed");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between bg-card px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Store className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-base font-bold">{estName}</h1>
            <p className="text-xs text-muted-foreground">{activeOrders.length} pedido(s) ativo(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleOpen}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
              isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {isOpen ? "ABERTO" : "FECHADO"}
          </button>
          <button onClick={handleLogout} className="p-2 rounded-full hover:bg-secondary">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-3">
        {activeOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Nenhum pedido no momento</p>
            <p className="text-sm text-muted-foreground/60">Novos pedidos aparecerão aqui automaticamente</p>
          </div>
        ) : (
          activeOrders.map((order) => {
            const statusInfo = STATUS_LABELS[order.status] || { label: order.status, icon: null, color: "bg-gray-100" };
            return (
              <div key={order.id} className="rounded-2xl border bg-card p-4 space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-foreground">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusInfo.color}`}>
                    {statusInfo.icon} {statusInfo.label}
                  </span>
                </div>

                <div className="rounded-xl bg-secondary/50 p-3">
                  <p className="text-sm font-medium">{order.item_description}</p>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>📍 {order.delivery_address}</p>
                  {order.house_reference && <p>🏠 {order.house_reference}</p>}
                </div>

                <div className="flex gap-2">
                  {(order.status === "pending" || order.status === "preparing") && (
                    <button
                      onClick={() => updateOrderStatus(order.id, order.status === "pending" ? "preparing" : "ready")}
                      className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground active:scale-[0.97]"
                    >
                      {order.status === "pending" ? "🔥 Iniciar Preparo" : "✅ Pedido Pronto"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default EstablishmentDashboard;
