import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Power, Loader2, MapPin, Phone, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const MotoboyDashboard = () => {
  const navigate = useNavigate();
  const { motoboyId, motoboyData, signOut, role, refetch } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(motoboyData?.is_available ?? false);
  const [toggling, setToggling] = useState(false);

  // Redirect admin to admin dashboard
  useEffect(() => {
    if (role === "admin") navigate("/admin", { replace: true });
  }, [role, navigate]);

  useEffect(() => {
    if (motoboyData) setIsOnline(motoboyData.is_available);
  }, [motoboyData]);

  // Fetch orders
  useEffect(() => {
    if (!motoboyId) return;
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("motoboy_id", motoboyId)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();

    // Realtime subscription
    const channel = supabase
      .channel("motoboy-orders")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `motoboy_id=eq.${motoboyId}`,
      }, () => fetchOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [motoboyId]);

  const todayOrders = orders.filter(
    (o) => new Date(o.created_at).toDateString() === new Date().toDateString()
  );
  const completedToday = todayOrders.filter((o) => o.status === "completed");
  const earningsToday = completedToday.length * 5; // R$7 - R$2 commission = R$5 net
  const commissionToday = completedToday.length * 2;

  const weekOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo && o.status === "completed";
  });
  const weekEarnings = weekOrders.length * 5;
  const weekCommission = weekOrders.length * 2;

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const activeOrders = orders.filter((o) =>
    ["accepted", "picking_up", "delivering"].includes(o.status)
  );

  const toggleOnline = async () => {
    if (!motoboyId) return;
    setToggling(true);
    const newStatus = !isOnline;
    await supabase
      .from("motoboys")
      .update({
        is_available: newStatus,
        status: newStatus ? "available" : "inactive",
        last_activity: new Date().toISOString(),
      })
      .eq("id", motoboyId);
    setIsOnline(newStatus);
    setToggling(false);
    toast({ title: newStatus ? "Você está online!" : "Você está offline" });
  };

  const acceptOrder = async (orderId: string) => {
    await supabase.from("orders").update({ status: "accepted" } as any).eq("id", orderId);
    await supabase.from("motoboys").update({ status: "busy", last_activity: new Date().toISOString() }).eq("id", motoboyId!);
    toast({ title: "Corrida aceita! 🚀" });
  };

  const rejectOrder = async (orderId: string) => {
    await supabase.from("orders").update({ status: "rejected", motoboy_id: null } as any).eq("id", orderId);
    toast({ title: "Corrida recusada" });
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const updates: any = { status };
    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
    }
    await supabase.from("orders").update(updates).eq("id", orderId);
    if (status === "completed") {
      await supabase.from("motoboys").update({ status: "available", last_activity: new Date().toISOString() }).eq("id", motoboyId!);
      toast({ title: "Entrega finalizada! ✅" });
    }
  };

  const openMap = (lat: number | null, lng: number | null) => {
    if (lat && lng) window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-4">
      {/* Header */}
      <header className="flex items-center justify-between bg-card px-4 py-3 border-b">
        <div>
          <h1 className="text-lg font-bold">Olá, {motoboyData?.name || "Motoboy"}</h1>
          <p className="text-xs text-muted-foreground">Painel do Motoboy</p>
        </div>
        <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-secondary">
          <LogOut className="h-5 w-5 text-muted-foreground" />
        </button>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Online toggle */}
        <button
          onClick={toggleOnline}
          disabled={toggling}
          className={`flex w-full items-center justify-center gap-3 rounded-xl py-4 text-base font-bold transition-all active:scale-[0.97] ${
            isOnline
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-muted text-muted-foreground border"
          }`}
        >
          {toggling ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Power className="h-5 w-5" />
          )}
          {isOnline ? "ONLINE ✓" : "FICAR ONLINE"}
        </button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Corridas hoje" value={completedToday.length.toString()} />
          <StatCard label="Ganho hoje" value={`R$${earningsToday}`} highlight />
          <StatCard label="Comissão" value={`R$${commissionToday}`} />
        </div>

        {/* Pending rides */}
        {pendingOrders.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase text-muted-foreground">Nova corrida!</h2>
            {pendingOrders.map((order) => (
              <div key={order.id} className="rounded-xl border-2 border-primary bg-card p-4 space-y-3 animate-pulse-subtle">
                <div className="space-y-1.5">
                  <p className="text-sm font-bold">🛒 {order.item_description}</p>
                  {order.purchase_location && <p className="text-xs text-muted-foreground">🏪 {order.purchase_location}</p>}
                  <p className="text-xs text-muted-foreground">📍 {order.delivery_address}</p>
                  <p className="text-xs text-muted-foreground">👤 {order.customer_name} • 📞 {order.customer_phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  {order.delivery_lat && (
                    <button
                      onClick={() => openMap(order.delivery_lat, order.delivery_lng)}
                      className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium"
                    >
                      <MapPin className="h-3 w-3" /> Abrir no mapa
                    </button>
                  )}
                  {order.customer_phone && (
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium"
                    >
                      <Phone className="h-3 w-3" /> Ligar
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptOrder(order.id)}
                    className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.97]"
                  >
                    ACEITAR
                  </button>
                  <button
                    onClick={() => rejectOrder(order.id)}
                    className="flex-1 rounded-xl border py-3 text-sm font-bold text-muted-foreground active:scale-[0.97]"
                  >
                    RECUSAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active rides */}
        {activeOrders.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase text-muted-foreground">Corrida em andamento</h2>
            {activeOrders.map((order) => (
              <div key={order.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="space-y-1.5">
                  <p className="text-sm font-bold">🛒 {order.item_description}</p>
                  <p className="text-xs text-muted-foreground">📍 {order.delivery_address}</p>
                  <p className="text-xs font-semibold text-primary">
                    {order.status === "accepted" && "🏍️ Indo buscar"}
                    {order.status === "picking_up" && "🛒 Buscando pedido"}
                    {order.status === "delivering" && "📦 Indo entregar"}
                  </p>
                </div>
                {order.delivery_lat && (
                  <button
                    onClick={() => openMap(order.delivery_lat, order.delivery_lng)}
                    className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium"
                  >
                    <ExternalLink className="h-3 w-3" /> Abrir no mapa
                  </button>
                )}
                <div className="flex gap-2">
                  {order.status === "accepted" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "picking_up")}
                      className="flex-1 rounded-xl bg-secondary py-3 text-sm font-bold active:scale-[0.97]"
                    >
                      BUSQUEI O PEDIDO
                    </button>
                  )}
                  {order.status === "picking_up" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "delivering")}
                      className="flex-1 rounded-xl bg-secondary py-3 text-sm font-bold active:scale-[0.97]"
                    >
                      SAINDO PRA ENTREGAR
                    </button>
                  )}
                  {order.status === "delivering" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "completed")}
                      className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.97]"
                    >
                      FINALIZAR ENTREGA ✅
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Weekly summary */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-sm font-bold uppercase text-muted-foreground">Resumo da Semana</h2>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Corridas" value={weekOrders.length.toString()} />
            <StatCard label="Ganho" value={`R$${weekEarnings}`} highlight />
            <StatCard label="Comissão" value={`R$${weekCommission}`} />
          </div>
          {weekCommission > 0 && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              💳 Pagamento até sexta-feira • Comissão: R${weekCommission}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="rounded-lg border bg-card p-3 text-center">
    <p className={`text-lg font-bold ${highlight ? "text-primary" : ""}`}>{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);

export default MotoboyDashboard;
