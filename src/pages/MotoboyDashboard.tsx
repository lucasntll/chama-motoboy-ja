import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Power, Loader2, MapPin, Phone, MessageCircle, ExternalLink, ChevronDown, ChevronUp, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { openWhatsApp } from "@/lib/whatsapp";
import { sendPushNotification } from "@/lib/sendPushNotification";
import { subscribeToPush } from "@/lib/pushSubscription";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { usePWAInstall } from "@/hooks/usePWAInstall";

interface DayGroup {
  date: string;
  label: string;
  rides: number;
  amount: number;
}

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const getMinutesAgo = (dateStr: string) => {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
};

const getUrgencyLevel = (dateStr: string): "normal" | "warning" | "urgent" => {
  const mins = getMinutesAgo(dateStr);
  if (mins >= 10) return "urgent";
  if (mins >= 5) return "warning";
  return "normal";
};

const urgencyStyles: Record<string, string> = {
  normal: "border-border",
  warning: "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10",
  urgent: "border-red-500 bg-red-50/50 dark:bg-red-900/10",
};

const MotoboyDashboard = () => {
  const navigate = useNavigate();
  const motoboyId = localStorage.getItem("motoboy_id");
  const motoboyName = localStorage.getItem("motoboy_name") || "Motoboy";
  const pwa = usePWAInstall();

  const [motoboyData, setMotoboyData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [allPending, setAllPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [declinedOrders, setDeclinedOrders] = useState<Record<string, number>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [, setTick] = useState(0);

  // Tick every 30s to update "há X min"
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!motoboyId) {
      navigate("/motoboy-acesso", { replace: true });
      return;
    }
    fetchAll();
    pwa.triggerShow("visit");
  }, [motoboyId]);

  const fetchAll = useCallback(async () => {
    if (!motoboyId) return;
    const [motoboyRes, myOrdersRes] = await Promise.all([
      supabase.from("motoboys").select("*").eq("id", motoboyId).maybeSingle(),
      supabase.from("orders").select("*").eq("motoboy_id", motoboyId).order("created_at", { ascending: false }),
    ]);
    const motoboy = motoboyRes.data;
    if (motoboy) {
      setMotoboyData(motoboy);
      setIsOnline(motoboy.is_available);
    }
    setOrders(myOrdersRes.data || []);

    // Fetch ALL pending orders available for this motoboy
    let pendingQuery = supabase
      .from("orders")
      .select("*")
      .is("motoboy_id", null)
      .in("status", ["pending", "queued", "ready_for_pickup"])
      .order("created_at", { ascending: true });

    if (motoboy?.city_id) {
      // Try city-specific first
      pendingQuery = pendingQuery.eq("city_id", motoboy.city_id);
    }

    const { data: pendingData } = await pendingQuery;
    
    // If city filter returned nothing, try without city filter
    let finalPending = pendingData || [];
    if (finalPending.length === 0 && motoboy?.city_id) {
      const { data: allPendingData } = await supabase
        .from("orders")
        .select("*")
        .is("motoboy_id", null)
        .in("status", ["pending", "queued", "ready_for_pickup"])
        .order("created_at", { ascending: true });
      finalPending = allPendingData || [];
    }
    
    // Show orders: dispatched to this motoboy first, then any unassigned
    const myPending = finalPending.filter((o: any) => {
      const dispatched = o.dispatched_to as string[] | null;
      // Show if dispatched to this motoboy, or if no specific dispatch (available to all)
      if (!dispatched || dispatched.length === 0) return true;
      return dispatched.includes(motoboyId!);
    });
    
    setAllPending(myPending);
    setLoading(false);
  }, [motoboyId]);

  const prevPendingCount = useRef(0);

  useEffect(() => {
    if (!motoboyId) return;
    const cityId = motoboyData?.city_id;
    const channels: any[] = [];

    // Listen for orders assigned to this motoboy
    const myChannel = supabase
      .channel("motoboy-my-orders")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `motoboy_id=eq.${motoboyId}`,
      }, () => fetchAll())
      .subscribe();
    channels.push(myChannel);

    // Listen for ALL order changes to catch new pending orders
    const pendingChannel = supabase
      .channel("motoboy-all-orders")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
      }, (payload) => {
        const row = payload.new as any;
        if (row && ["pending", "queued", "ready_for_pickup", "accepted", "completed", "cancelled"].includes(row.status)) {
          fetchAll();
        }
      })
      .subscribe();
    channels.push(pendingChannel);

    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [motoboyId, motoboyData?.city_id, fetchAll]);

  const hasActiveRide = orders.some((o) => ["accepted", "picking_up", "delivering"].includes(o.status));

  const visiblePending = useMemo(() => {
    const now = Date.now();
    return allPending.filter((o) => {
      const expiry = declinedOrders[o.id];
      return !expiry || now >= expiry;
    });
  }, [allPending, declinedOrders]);

  useEffect(() => {
    if (allPending.length > prevPendingCount.current && prevPendingCount.current >= 0 && isOnline && !hasActiveRide) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; osc.type = "sine"; gain.gain.value = 0.3;
        osc.start(); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.stop(ctx.currentTime + 0.5);
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2); gain2.connect(ctx.destination);
          osc2.frequency.value = 1100; osc2.type = "sine"; gain2.gain.value = 0.3;
          osc2.start(); gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          osc2.stop(ctx.currentTime + 0.5);
        }, 200);
      } catch (_) {}
      toast.success("Nova corrida disponível! 🚀");
    }
    prevPendingCount.current = allPending.length;
  }, [allPending.length, isOnline]);

  const completedOrders = useMemo(() => orders.filter((o) => o.status === "completed"), [orders]);

  const todayStr = new Date().toLocaleDateString("pt-BR");
  const todayCompleted = completedOrders.filter(
    (o) => new Date(o.completed_at || o.created_at).toLocaleDateString("pt-BR") === todayStr
  );

  const dailyHistory: DayGroup[] = useMemo(() => {
    const groups: Record<string, DayGroup> = {};
    completedOrders.forEach((o) => {
      const d = new Date(o.completed_at || o.created_at);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("pt-BR");
      if (!groups[key]) groups[key] = { date: key, label, rides: 0, amount: 0 };
      groups[key].rides++;
      groups[key].amount += 2;
    });
    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [completedOrders]);

  const totalAccumulated = completedOrders.length;
  const activeOrder = orders.find((o) => ["accepted", "picking_up", "delivering"].includes(o.status));

  const toggleOnline = async () => {
    if (!motoboyId) return;
    setToggling(true);
    const newStatus = !isOnline;
    await supabase.from("motoboys").update({
      is_available: newStatus,
      status: newStatus ? "available" : "inactive",
      last_activity: new Date().toISOString(),
    }).eq("id", motoboyId);
    setIsOnline(newStatus);
    setToggling(false);
    toast(newStatus ? "Você está online! 🟢" : "Você está offline ⚪");
    
    // Subscribe to push when going online
    if (newStatus) {
      const cityId = motoboyData?.city_id;
      subscribeToPush("motoboy", motoboyId, cityId);
    }
  };

  const acceptOrder = async (orderId: string) => {
    if (hasActiveRide) { toast.error("Você já tem uma corrida ativa!"); return; }
    
    // Atomic accept: only update if still unassigned and pending
    const { data: updated, error } = await supabase
      .from("orders")
      .update({ status: "accepted", motoboy_id: motoboyId, dispatched_to: [] } as any)
      .eq("id", orderId)
      .is("motoboy_id", null)
      .in("status", ["pending", "queued", "ready_for_pickup"])
      .select("id")
      .maybeSingle();
    
    if (error || !updated) {
      toast.error("Corrida já aceita por outro motoboy");
      fetchAll();
      return;
    }
    await supabase.from("motoboys").update({ status: "busy", last_activity: new Date().toISOString() }).eq("id", motoboyId);
    
    // Get order details for push notification (no WhatsApp auto-open)
    const { data: orderData } = await supabase.from("orders").select("customer_phone, city_id").eq("id", orderId).maybeSingle();
    if (orderData) {
      sendPushNotification({
        event: "motoboy_accepted",
        order_id: orderId,
        customer_phone: orderData.customer_phone,
      });
    }
    
    toast.success("Corrida aceita! 🚀");
    setDeclinedOrders((prev) => { const n = { ...prev }; delete n[orderId]; return n; });
    fetchAll();
  };

  const finalizeOrder = async (orderId: string) => {
    // Get order details for push before updating
    const { data: orderData } = await supabase.from("orders").select("customer_phone").eq("id", orderId).maybeSingle();
    
    await supabase.from("orders").update({ status: "completed", completed_at: new Date().toISOString() } as any).eq("id", orderId);
    await supabase.from("motoboys").update({ status: "available", last_activity: new Date().toISOString() }).eq("id", motoboyId!);
    
    if (orderData) {
      sendPushNotification({
        event: "order_completed",
        order_id: orderId,
        customer_phone: orderData.customer_phone,
      });
    }

    // Auto-dispatch: promote next queued order and dispatch to this motoboy
    const { dispatchOrderToMotoboys } = await import("@/lib/dispatchOrder");
    
    let nextQuery = supabase
      .from("orders")
      .select("id")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(1);

    if (motoboyData?.city_id) {
      nextQuery = nextQuery.eq("city_id", motoboyData.city_id);
    }

    const { data: nextQueued } = await nextQuery.maybeSingle();

    if (nextQueued) {
      await supabase.from("orders").update({ status: "pending" } as any).eq("id", nextQueued.id);
      await dispatchOrderToMotoboys(nextQueued.id, motoboyData?.city_id);
      toast.success("Entrega finalizada! ✅ Próximo pedido da fila liberado automaticamente!");
    } else {
      toast.success("Entrega finalizada! ✅");
    }
    fetchAll();
  };

  const declineOrder = (orderId: string) => {
    // Hide this order for 5 minutes
    setDeclinedOrders((prev) => ({ ...prev, [orderId]: Date.now() + 5 * 60 * 1000 }));
    toast("Corrida recusada. Ela continua disponível para outros motoboys.");
  };

  const cancelAcceptedOrder = async (orderId: string) => {
    await supabase.from("orders").update({ status: "pending", motoboy_id: null, dispatched_to: [] } as any).eq("id", orderId);
    await supabase.from("motoboys").update({ status: "available", last_activity: new Date().toISOString() }).eq("id", motoboyId!);
    // Re-dispatch to available motoboys
    const { dispatchOrderToMotoboys } = await import("@/lib/dispatchOrder");
    const orderData = await supabase.from("orders").select("city_id").eq("id", orderId).maybeSingle();
    await dispatchOrderToMotoboys(orderId, orderData?.data?.city_id);
    toast.success("Corrida cancelada. Ela voltou para a lista.");
    setCancelOrderId(null);
    fetchAll();
  };

  const handleWhatsApp = (phone: string, name: string) => {
    openWhatsApp(phone, `Olá ${name}, sou o motoboy da sua entrega pelo ChamaMoto!`);
  };

  const openGoogleMaps = (order: any) => {
    const dest = order.delivery_address
      ? encodeURIComponent(order.delivery_address)
      : order.delivery_lat && order.delivery_lng
        ? `${order.delivery_lat},${order.delivery_lng}`
        : null;
    if (dest) window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank");
  };

  const openWaze = (order: any) => {
    if (order.delivery_lat && order.delivery_lng) {
      window.open(`https://waze.com/ul?ll=${order.delivery_lat},${order.delivery_lng}&navigate=yes`, "_blank");
    } else if (order.delivery_address) {
      window.open(`https://waze.com/ul?q=${encodeURIComponent(order.delivery_address)}&navigate=yes`, "_blank");
    }
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
            isOnline ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground border"
          }`}
        >
          {toggling ? <Loader2 className="h-5 w-5 animate-spin" /> : <Power className="h-5 w-5" />}
          {isOnline ? "ONLINE ✓" : "FICAR ONLINE"}
        </button>

        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Hoje" value={todayCompleted.length.toString()} />
          <StatCard label="Hoje (R$)" value={`R$${todayCompleted.length * 2}`} highlight />
          <StatCard label="Total geral" value={`R$${totalAccumulated * 2}`} />
        </div>

        <div className="rounded-lg border bg-card px-4 py-2">
          <p className="text-xs text-muted-foreground text-center">
            💡 Você paga apenas pelas corridas concluídas (R$2 por entrega)
          </p>
        </div>

        {dailyHistory.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex w-full items-center justify-between text-sm font-bold uppercase text-muted-foreground"
            >
              <span>📊 Histórico por dia</span>
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showHistory && (
              <div className="space-y-1.5">
                {dailyHistory.map((d) => (
                  <div key={d.date} className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
                    <span className="text-sm font-medium">{d.label}</span>
                    <span className="text-sm font-bold text-primary">
                      {d.rides} {d.rides === 1 ? "corrida" : "corridas"} — R${d.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

         {activeOrder && (
          <ActiveOrderCard
            order={activeOrder}
            onFinalize={finalizeOrder}
            onCancel={() => setCancelOrderId(activeOrder.id)}
            onGoogleMaps={openGoogleMaps}
            onWaze={openWaze}
            onWhatsApp={handleWhatsApp}
          />
        )}

        {isOnline && !hasActiveRide && visiblePending.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase text-muted-foreground">
              Corridas disponíveis ({visiblePending.length})
            </h2>
            {visiblePending.map((order) => (
              <PendingOrderCard key={order.id} order={order} onAccept={() => setConfirmOrderId(order.id)} onDecline={() => declineOrder(order.id)} onGoogleMaps={openGoogleMaps} onWaze={openWaze} />
            ))}
          </div>
        )}

        {isOnline && !hasActiveRide && visiblePending.length === 0 && (
          <EmptyState emoji="🏍️" title="Nenhuma corrida disponível" subtitle="Aguarde novos pedidos..." />
        )}

        {!isOnline && (
          <EmptyState emoji="😴" title="Você está offline" subtitle="Fique online para receber corridas" />
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
              <button onClick={() => setConfirmOrderId(null)} className="flex-1 rounded-xl border py-3 text-sm font-bold text-muted-foreground active:scale-[0.97]">Cancelar</button>
              <button onClick={() => { acceptOrder(confirmOrderId); setConfirmOrderId(null); }} className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.97]">Confirmar ✓</button>
            </div>
          </div>
        </div>
      )}

      {cancelOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-center">Cancelar corrida?</h3>
            <p className="text-sm text-muted-foreground text-center">
              Tem certeza que deseja cancelar esta corrida? Ela voltará para a lista de corridas disponíveis.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelOrderId(null)} className="flex-1 rounded-xl border py-3 text-sm font-bold text-muted-foreground active:scale-[0.97]">Não</button>
              <button onClick={() => cancelAcceptedOrder(cancelOrderId)} className="flex-1 rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground active:scale-[0.97]">Sim, cancelar</button>
            </div>
          </div>
        </div>
      )}

      {pwa.canShow && !pwa.isInstalled && (
        <PWAInstallPrompt
          variant="motoboy"
          isIOS={pwa.isIOS}
          hasNativePrompt={pwa.hasNativePrompt}
          onInstall={pwa.installNative}
          onDismiss={pwa.dismiss}
        />
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

const EmptyState = ({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <span className="text-4xl mb-3">{emoji}</span>
    <p className="text-sm font-semibold text-muted-foreground">{title}</p>
    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
  </div>
);

const ActiveOrderCard = ({ order, onFinalize, onCancel, onGoogleMaps, onWaze, onWhatsApp }: any) => (
  <div className="space-y-2">
    <h2 className="text-sm font-bold uppercase text-muted-foreground">Corrida em andamento</h2>
    <div className="rounded-xl border-2 border-primary bg-card p-4 space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold">🛒 {order.item_description}</p>
          <OrderTypeBadge orderType={order.order_type} />
        </div>
        <p className="text-xs text-muted-foreground">📍 {order.delivery_address}</p>
        <p className="text-xs text-muted-foreground">👤 {order.customer_name} • 📞 {order.customer_phone}</p>
        <OrderTimeInfo createdAt={order.created_at} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => onGoogleMaps(order)} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium">
          <MapPin className="h-3 w-3" /> Google Maps
        </button>
        <button onClick={() => onWaze(order)} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium">
          <ExternalLink className="h-3 w-3" /> Waze
        </button>
        {order.customer_phone && (
          <a href={`tel:${order.customer_phone}`} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium">
            <Phone className="h-3 w-3" /> Ligar
          </a>
        )}
        {order.customer_phone && (
          <button onClick={() => onWhatsApp(order.customer_phone, order.customer_name)} className="flex items-center gap-1 rounded-lg bg-green-600 text-white px-3 py-2 text-xs font-medium">
            <MessageCircle className="h-3 w-3" /> WhatsApp
          </button>
        )}
      </div>
      <button onClick={() => onFinalize(order.id)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground active:scale-[0.97] shadow-lg">
        FINALIZAR CORRIDA ✅
      </button>
      {order.status === "accepted" && (
        <button onClick={onCancel} className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive py-3 text-sm font-bold text-destructive active:scale-[0.97]">
          <X className="h-4 w-4" /> Cancelar corrida
        </button>
      )}
    </div>
  </div>
);

const OrderTimeInfo = ({ createdAt }: { createdAt: string }) => {
  const mins = getMinutesAgo(createdAt);
  const time = formatTime(createdAt);
  const urgency = getUrgencyLevel(createdAt);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-muted-foreground">
        🕒 Pedido feito às {time} (há {mins} min)
      </span>
      {urgency === "urgent" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400">
          <AlertTriangle className="h-3 w-3" /> Aguardando há mais tempo
        </span>
      )}
    </div>
  );
};

const OrderTypeBadge = ({ orderType }: { orderType: string }) => {
  const isPartner = orderType === "partner";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
      isPartner
        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
    }`}>
      {isPartner ? "🟢 Retirada rápida" : "🔴 Compra no local"}
    </span>
  );
};

const PendingOrderCard = ({ order, onAccept, onDecline, onGoogleMaps, onWaze }: any) => {
  const urgency = getUrgencyLevel(order.created_at);

  return (
    <div className={`rounded-xl border-2 bg-card p-4 space-y-3 transition-colors ${urgencyStyles[urgency]}`}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <p className="text-sm font-bold">🛒 {order.item_description}</p>
          <div className="flex items-center gap-1.5">
            <OrderTypeBadge orderType={order.order_type} />
            {urgency === "urgent" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400 animate-pulse">
                <AlertTriangle className="h-3 w-3" /> URGENTE
              </span>
            )}
            {urgency === "warning" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-[10px] font-bold text-yellow-700 dark:text-yellow-400">
                ⚠️ Atenção
              </span>
            )}
          </div>
        </div>
        {order.purchase_location && <p className="text-xs text-muted-foreground">🏪 {order.purchase_location}</p>}
        <p className="text-xs text-muted-foreground">📍 {order.delivery_address}</p>
        <p className="text-xs text-muted-foreground">👤 {order.customer_name} • 📞 {order.customer_phone}</p>
        <OrderTimeInfo createdAt={order.created_at} />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onGoogleMaps(order)} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium">
          <MapPin className="h-3 w-3" /> Google Maps
        </button>
        <button onClick={() => onWaze(order)} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium">
          <ExternalLink className="h-3 w-3" /> Waze
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={onDecline} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-muted-foreground/30 py-3 text-sm font-bold text-muted-foreground active:scale-[0.97]">
          RECUSAR
        </button>
        <button onClick={onAccept} className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground active:scale-[0.97]">
          ACEITAR CORRIDA
        </button>
      </div>
    </div>
  );
};

export default MotoboyDashboard;

// PWA prompt is rendered inside MotoboyDashboard
