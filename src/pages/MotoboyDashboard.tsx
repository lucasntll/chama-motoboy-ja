import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Power, Loader2, MapPin, Phone, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const MotoboyDashboard = () => {
  const navigate = useNavigate();
  const motoboyId = localStorage.getItem("motoboy_id");
  const motoboyName = localStorage.getItem("motoboy_name") || "Motoboy";

  const [motoboyData, setMotoboyData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [allPending, setAllPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!motoboyId) {
      navigate("/motoboy-acesso", { replace: true });
      return;
    }
    fetchAll();
  }, [motoboyId]);

  const fetchAll = useCallback(async () => {
    if (!motoboyId) return;

    const [motoboyRes, myOrdersRes, pendingRes] = await Promise.all([
      supabase.from("motoboys").select("*").eq("id", motoboyId).maybeSingle(),
      supabase.from("orders").select("*").eq("motoboy_id", motoboyId).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("status", "pending").is("motoboy_id", null).order("created_at", { ascending: false }),
    ]);

    if (motoboyRes.data) {
      setMotoboyData(motoboyRes.data);
      setIsOnline(motoboyRes.data.is_available);
    }
    setOrders(myOrdersRes.data || []);
    setAllPending(pendingRes.data || []);
    setLoading(false);
  }, [motoboyId]);

  // Realtime
  useEffect(() => {
    if (!motoboyId) return;

    const channel = supabase
      .channel("motoboy-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [motoboyId, fetchAll]);

  const todayCompleted = orders.filter(
    (o) => o.status === "completed" && new Date(o.created_at).toDateString() === new Date().toDateString()
  );
  const totalAccumulated = orders.filter((o) => o.status === "completed").length;
  const hasActiveRide = orders.some((o) => ["accepted", "picking_up", "delivering"].includes(o.status));
  const activeOrder = orders.find((o) => ["accepted", "picking_up", "delivering"].includes(o.status));

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
    toast({ title: newStatus ? "Você está online! 🟢" : "Você está offline ⚪" });
  };

  const acceptOrder = async (orderId: string) => {
    if (hasActiveRide) {
      toast({ title: "Você já tem uma corrida ativa!", variant: "destructive" });
      return;
    }

    // Check if order is still available
    const { data: check } = await supabase
      .from("orders")
      .select("status, motoboy_id")
      .eq("id", orderId)
      .maybeSingle();

    if (!check || check.motoboy_id || check.status !== "pending") {
      toast({ title: "Corrida já aceita por outro motoboy", variant: "destructive" });
      fetchAll();
      return;
    }

    await supabase.from("orders").update({
      status: "accepted",
      motoboy_id: motoboyId,
    } as any).eq("id", orderId);

    await supabase.from("motoboys").update({
      status: "busy",
      last_activity: new Date().toISOString(),
    }).eq("id", motoboyId);

    toast({ title: "Corrida aceita! 🚀" });
    fetchAll();
  };

  const finalizeOrder = async (orderId: string) => {
    await supabase.from("orders").update({
      status: "completed",
      completed_at: new Date().toISOString(),
    } as any).eq("id", orderId);

    await supabase.from("motoboys").update({
      status: "available",
      last_activity: new Date().toISOString(),
    }).eq("id", motoboyId!);

    toast({ title: "Entrega finalizada! ✅" });
    fetchAll();
  };

  const openMap = (lat: number | null, lng: number | null) => {
    if (lat && lng) window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  const handleLogout = () => {
    localStorage.removeItem("motoboy_id");
    localStorage.removeItem("motoboy_name");
    navigate("/", { replace: true });
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
          <h1 className="text-lg font-bold">Olá, {motoboyName}</h1>
          <p className="text-xs text-muted-foreground">Painel do Motoboy</p>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-secondary">
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
          {toggling ? <Loader2 className="h-5 w-5 animate-spin" /> : <Power className="h-5 w-5" />}
          {isOnline ? "ONLINE ✓" : "FICAR ONLINE"}
        </button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Corridas hoje" value={todayCompleted.length.toString()} />
          <StatCard label="Acumulado" value={`R$${totalAccumulated}`} highlight />
          <StatCard label="Comissão" value={`R$${totalAccumulated}`} />
        </div>

        {/* Active ride */}
        {activeOrder && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase text-muted-foreground">Corrida em andamento</h2>
            <div className="rounded-xl border-2 border-primary bg-card p-4 space-y-3">
              <div className="space-y-1.5">
                <p className="text-sm font-bold">🛒 {activeOrder.item_description}</p>
                {activeOrder.purchase_location && <p className="text-xs text-muted-foreground">🏪 {activeOrder.purchase_location}</p>}
                <p className="text-xs text-muted-foreground">📍 {activeOrder.delivery_address}</p>
                <p className="text-xs text-muted-foreground">👤 {activeOrder.customer_name} • 📞 {activeOrder.customer_phone}</p>
              </div>
              <div className="flex items-center gap-2">
                {activeOrder.delivery_lat && (
                  <button
                    onClick={() => openMap(activeOrder.delivery_lat, activeOrder.delivery_lng)}
                    className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium"
                  >
                    <MapPin className="h-3 w-3" /> Mapa
                  </button>
                )}
                {activeOrder.customer_phone && (
                  <a
                    href={`tel:${activeOrder.customer_phone}`}
                    className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium"
                  >
                    <Phone className="h-3 w-3" /> Ligar
                  </a>
                )}
              </div>
              <button
                onClick={() => finalizeOrder(activeOrder.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground active:scale-[0.97] shadow-lg"
              >
                FINALIZAR CORRIDA ✅
              </button>
            </div>
          </div>
        )}

        {/* Available rides (only if online and no active ride) */}
        {isOnline && !hasActiveRide && allPending.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase text-muted-foreground">
              Corridas disponíveis ({allPending.length})
            </h2>
            {allPending.map((order) => (
              <div key={order.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="space-y-1.5">
                  <p className="text-sm font-bold">🛒 {order.item_description}</p>
                  {order.purchase_location && <p className="text-xs text-muted-foreground">🏪 {order.purchase_location}</p>}
                  <p className="text-xs text-muted-foreground">📍 {order.delivery_address}</p>
                  <p className="text-xs text-muted-foreground">👤 {order.customer_name} • 📞 {order.customer_phone}</p>
                </div>
                {order.delivery_lat && (
                  <button
                    onClick={() => openMap(order.delivery_lat, order.delivery_lng)}
                    className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium"
                  >
                    <ExternalLink className="h-3 w-3" /> Ver no mapa
                  </button>
                )}
                <button
                  onClick={() => acceptOrder(order.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground active:scale-[0.97]"
                >
                  ACEITAR CORRIDA
                </button>
              </div>
            ))}
          </div>
        )}

        {isOnline && !hasActiveRide && allPending.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-3">🏍️</span>
            <p className="text-sm font-semibold text-muted-foreground">Nenhuma corrida disponível</p>
            <p className="text-xs text-muted-foreground mt-1">Aguarde novos pedidos...</p>
          </div>
        )}

        {!isOnline && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-3">😴</span>
            <p className="text-sm font-semibold text-muted-foreground">Você está offline</p>
            <p className="text-xs text-muted-foreground mt-1">Fique online para receber corridas</p>
          </div>
        )}
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
