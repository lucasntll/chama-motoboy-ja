import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Power, Loader2, MapPin, Phone, MessageCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { openWhatsApp } from "@/lib/whatsapp";

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
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);

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

  const prevPendingCount = useRef(0);

  useEffect(() => {
    if (!motoboyId) return;
    const channel = supabase
      .channel("motoboy-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [motoboyId, fetchAll]);

  useEffect(() => {
    if (allPending.length > prevPendingCount.current && prevPendingCount.current >= 0 && isOnline && !hasActiveRide) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = "sine";
        gain.gain.value = 0.3;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.stop(ctx.currentTime + 0.5);
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 1100;
          osc2.type = "sine";
          gain2.gain.value = 0.3;
          osc2.start();
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          osc2.stop(ctx.currentTime + 0.5);
        }, 200);
      } catch (_) {}
      toast.success("Nova corrida disponível! 🚀");
    }
    prevPendingCount.current = allPending.length;
  }, [allPending.length, isOnline]);

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
    toast(newStatus ? "Você está online! 🟢" : "Você está offline ⚪");
  };

  const acceptOrder = async (orderId: string) => {
    if (hasActiveRide) {
      toast.error("Você já tem uma corrida ativa!");
      return;
    }

    const { data: check } = await supabase
      .from("orders")
      .select("status, motoboy_id")
      .eq("id", orderId)
      .maybeSingle();

    if (!check || check.motoboy_id || check.status !== "pending") {
      toast.error("Corrida já aceita por outro motoboy");
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

    toast.success("Corrida aceita! 🚀");
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

    toast.success("Entrega finalizada! ✅");
    fetchAll();
  };

  const handleWhatsApp = (phone: string, name: string) => {
    openWhatsApp(phone, `Olá ${name}, sou o motoboy da sua entrega pelo ChamaMoto!`);
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

        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Corridas hoje" value={todayCompleted.length.toString()} />
          <StatCard label="Total corridas" value={totalAccumulated.toString()} />
          <StatCard label="A pagar" value={`R$${totalAccumulated * 2}`} highlight />
        </div>

        <div className="rounded-lg border bg-card px-4 py-2">
          <p className="text-xs text-muted-foreground text-center">
            💡 Você paga apenas pelas corridas concluídas (R$2 por entrega)
          </p>
        </div>

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
              <div className="flex items-center gap-2 flex-wrap">
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
                {activeOrder.customer_phone && (
                  <button
                    onClick={() => handleWhatsApp(activeOrder.customer_phone, activeOrder.customer_name)}
                    className="flex items-center gap-1 rounded-lg bg-green-600 text-white px-3 py-2 text-xs font-medium"
                  >
                    <MessageCircle className="h-3 w-3" /> WhatsApp
                  </button>
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
                  onClick={() => setConfirmOrderId(order.id)}
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

      {confirmOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-center">Aceitar corrida?</h3>
            <p className="text-sm text-muted-foreground text-center">
              Ao confirmar, você se compromete a realizar esta entrega.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOrderId(null)}
                className="flex-1 rounded-xl border py-3 text-sm font-bold text-muted-foreground active:scale-[0.97]"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  acceptOrder(confirmOrderId);
                  setConfirmOrderId(null);
                }}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.97]"
              >
                Confirmar ✓
              </button>
            </div>
          </div>
        </div>
      )}
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
