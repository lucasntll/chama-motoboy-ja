import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Phone, MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { openWhatsApp } from "@/lib/whatsapp";
import { playIPhoneDing } from "@/lib/notifications";
import { sendPushNotification } from "@/lib/sendPushNotification";
import { subscribeToPush } from "@/lib/pushSubscription";
import NotificationPermissionPrompt from "@/components/NotificationPermissionPrompt";
import FeedbackModal from "@/components/FeedbackModal";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import TrackingMap from "@/components/TrackingMap";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";

const STATUS_MAP: Record<string, { label: string; emoji: string; color: string }> = {
  awaiting_confirmation: { label: "Aguardando confirmação do estabelecimento", emoji: "🏪", color: "text-purple-600" },
  awaiting_customer_confirmation: { label: "Confirme o valor do pedido", emoji: "💰", color: "text-indigo-600" },
  awaiting_preparation: { label: "Estabelecimento preparando", emoji: "🔥", color: "text-orange-600" },
  queued: { label: "Na fila de espera", emoji: "⏳", color: "text-orange-600" },
  pending: { label: "Procurando motoboy...", emoji: "🔍", color: "text-yellow-600" },
  accepted: { label: "Motoboy a caminho!", emoji: "🏍️", color: "text-blue-600" },
  picking_up: { label: "Buscando seu pedido", emoji: "🛒", color: "text-blue-600" },
  delivering: { label: "Indo entregar", emoji: "📦", color: "text-blue-600" },
  completed: { label: "Entrega finalizada!", emoji: "✅", color: "text-primary" },
  cancelled: { label: "Pedido cancelado", emoji: "❌", color: "text-destructive" },
};

const OrderTracking = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const pwa = usePWAInstall();
  const [order, setOrder] = useState<any>(null);
  const [motoboy, setMotoboy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showArrivalCelebration, setShowArrivalCelebration] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [showNotifPrompt, setShowNotifPrompt] = useState(
    "Notification" in window && Notification.permission !== "granted"
  );
  const [queueTotal, setQueueTotal] = useState(0);
  const [showAcceptedBanner, setShowAcceptedBanner] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [motoboyCoords, setMotoboyCoords] = useState<[number, number] | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);

  // Listen for PWA install trigger from order creation
  useEffect(() => {
    const handler = () => pwa.triggerShow("order");
    window.addEventListener("pwa-trigger-install", handler);
    pwa.triggerShow("order");
    return () => window.removeEventListener("pwa-trigger-install", handler);
  }, []);

  // Re-sync when app returns from background
  useRefetchOnFocus(() => fetchOrder(), !!orderId);

  const fetchOrder = async () => {
    if (!orderId) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (data) {
      // Detect transition to "accepted" from queue/pending
      if (previousStatus && previousStatus !== data.status) {
        if (
          (previousStatus === "queued" || previousStatus === "pending") &&
          data.status === "accepted"
        ) {
          setShowAcceptedBanner(true);
          playIPhoneDing();
          toast("🚀 Seu pedido foi aceito por um motoboy!", { duration: 6000 });
          setTimeout(() => setShowAcceptedBanner(false), 12000);
          // Local push: motoboy accepted the order
          import("@/lib/despiaNotifications").then(m => m.notifyMotoboyAccepted(orderId!));
        } else if (data.status === "delivering") {
          playIPhoneDing();
          toast("🛵 Seu pedido saiu para entrega!", { duration: 6000 });
          // Local push: motoboy out for delivery
          import("@/lib/despiaNotifications").then(m => m.notifyMotoboyOutForDelivery(orderId!));
        } else if (data.status === "completed") {
          setShowArrivalCelebration(true);
          playIPhoneDing();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
          // Local push: order delivered with thank-you
          import("@/lib/despiaNotifications").then(m => m.notifyOrderDelivered(orderId!));
        }
      }
      setPreviousStatus(data.status);
      setOrder(data);

      // Set delivery coordinates
      if (data.delivery_lat && data.delivery_lng) {
        setDeliveryCoords([data.delivery_lat, data.delivery_lng]);
      }

      if (data.motoboy_id) {
        const { data: m } = await supabase
          .from("motoboys")
          .select("name, phone, latitude, longitude")
          .eq("id", data.motoboy_id)
          .maybeSingle();
        setMotoboy(m);
        if (m?.latitude && m?.longitude) {
          setMotoboyCoords([m.latitude, m.longitude]);
        }
      }
      // Queue position
      if (data.status === "queued") {
        const { data: queuedOrders } = await supabase
          .from("orders")
          .select("id, created_at")
          .eq("status", "queued")
          .order("created_at", { ascending: true });
        const allQueued = queuedOrders || [];
        setQueueTotal(allQueued.length);
        const pos = allQueued.findIndex((q: any) => q.id === orderId) + 1;
        setQueuePosition(pos > 0 ? pos : allQueued.length);
      }
      // Check if already reviewed
      if (data.status === "completed") {
        const { data: review } = await supabase
          .from("reviews" as any)
          .select("id")
          .eq("order_id", orderId)
          .maybeSingle();
        if (review) setHasReviewed(true);
        else setShowFeedback(true);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrder(); }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      }, () => fetchOrder())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  // Poll motoboy location every 5s for active deliveries
  useEffect(() => {
    if (!order?.motoboy_id) return;
    const isActive = ["accepted", "picking_up", "delivering"].includes(order.status);
    if (!isActive) return;

    const pollLocation = async () => {
      const { data: m } = await supabase
        .from("motoboys")
        .select("latitude, longitude")
        .eq("id", order.motoboy_id)
        .maybeSingle();
      if (m?.latitude && m?.longitude) {
        setMotoboyCoords([m.latitude, m.longitude]);
      }
    };

    const interval = setInterval(pollLocation, 5000);
    return () => clearInterval(interval);
  }, [order?.motoboy_id, order?.status]);

  const handleCancel = async () => {
    if (!orderId || !order) return;
    setCancelling(true);
    await supabase.from("orders").update({ status: "cancelled" } as any).eq("id", orderId);
    toast.success("Pedido cancelado");
    setCancelling(false);
    fetchOrder();
  };

  const handleCustomerConfirm = async () => {
    if (!orderId) return;
    setConfirming(true);
    await supabase.from("orders").update({ status: "awaiting_preparation" } as any).eq("id", orderId);
    
    // Notify motoboys that customer confirmed
    if (order) {
      sendPushNotification({
        event: "customer_confirmed",
        order_id: orderId,
        city_id: order.city_id,
        customer_phone: order.customer_phone,
      });
    }
    
    toast.success("Pedido confirmado! Aguardando preparo.");
    setConfirming(false);
    fetchOrder();
  };

  const handleCustomerReject = async () => {
    if (!orderId) return;
    setCancelling(true);
    await supabase.from("orders").update({ status: "cancelled" } as any).eq("id", orderId);
    toast.success("Pedido cancelado");
    setCancelling(false);
    fetchOrder();
  };

  const handleWhatsApp = () => {
    if (!motoboy?.phone) return;
    openWhatsApp(motoboy.phone, `Olá ${motoboy.name}, estou acompanhando meu pedido!`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <p className="text-lg font-bold">Pedido não encontrado</p>
        <button onClick={() => navigate("/")} className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
          Voltar
        </button>
      </div>
    );
  }

  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const canCancel = ["pending", "queued", "awaiting_confirmation", "awaiting_customer_confirmation"].includes(order.status);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate("/")} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Acompanhar Pedido</h1>
      </header>

      <main className="flex-1 px-4 py-6 space-y-5 relative">
        {/* Notification permission prompt for clients */}
        {showNotifPrompt && order && (
          <NotificationPermissionPrompt
            userType="client"
            referenceId={order.customer_phone}
            cityId={order.city_id}
            onDismiss={() => setShowNotifPrompt(false)}
          />
        )}
        {/* Arrival celebration overlay */}
        {showArrivalCelebration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in px-6">
            <div className="w-full max-w-sm rounded-2xl bg-card border-2 border-primary shadow-2xl p-8 text-center space-y-4 animate-scale-in relative overflow-hidden">
              {/* Confetti particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute rounded-full animate-bounce"
                    style={{
                      width: `${6 + Math.random() * 8}px`,
                      height: `${6 + Math.random() * 8}px`,
                      background: `hsl(${Math.random() * 360}, 80%, 60%)`,
                      left: `${Math.random() * 100}%`,
                      top: `${-10 + Math.random() * 30}%`,
                      animationDuration: `${1 + Math.random() * 2}s`,
                      animationDelay: `${Math.random() * 0.5}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-7xl block animate-bounce">🎉</span>
              <h2 className="text-2xl font-extrabold text-primary">
                Pedido Entregue!
              </h2>
              <p className="text-base text-foreground font-medium leading-relaxed">
                Seu pedido foi entregue com sucesso! 🏍️✨
              </p>
              <p className="text-sm text-muted-foreground">
                Obrigado por usar o ChamaMotoboy!
              </p>
              <button
                onClick={() => setShowArrivalCelebration(false)}
                className="mt-2 w-full rounded-xl bg-primary py-3 text-base font-bold text-primary-foreground active:scale-[0.97] transition-transform"
              >
                Fechar 🎊
              </button>
            </div>
          </div>
        )}

        {showAcceptedBanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in px-6">
            <div className="w-full max-w-sm rounded-2xl bg-card border-2 border-primary shadow-2xl p-8 text-center space-y-4 animate-scale-in">
              <span className="text-6xl block">🏍️</span>
              <h2 className="text-2xl font-extrabold text-primary">
                Motoboy encontrado!
              </h2>
              <p className="text-base text-foreground font-medium leading-relaxed">
                Um motoboy acabou de aceitar seu pedido e já está a caminho! 🎉
              </p>
              <p className="text-sm text-muted-foreground">
                Fique tranquilo, sua entrega está sendo cuidada.
              </p>
              <button
                onClick={() => setShowAcceptedBanner(false)}
                className="mt-2 w-full rounded-xl bg-primary py-3 text-base font-bold text-primary-foreground active:scale-[0.97]"
              >
                Entendi! 👍
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col items-center text-center py-6">
          <span className="text-5xl mb-4">{status.emoji}</span>
          <h2 className={`text-xl font-bold ${status.color}`}>{status.label}</h2>

          {/* Awaiting establishment confirmation */}
          {order.status === "awaiting_confirmation" && (
            <div className="mt-3 space-y-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                <p className="text-sm text-muted-foreground">O estabelecimento está verificando seu pedido e informará o valor em breve.</p>
              </div>
            </div>
          )}

          {/* Customer confirmation with price breakdown */}
          {order.status === "awaiting_customer_confirmation" && (
            <div className="mt-4 w-full space-y-3">
              <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50 p-4 space-y-2">
                <p className="text-sm font-bold text-indigo-800">📋 Resumo do valor:</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Produtos:</span>
                  <span className="font-bold">R$ {(order.product_value ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete:</span>
                  <span className="font-bold">R$ {(order.delivery_fee ?? 0).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-base">
                  <span className="font-bold">Total:</span>
                  <span className="font-extrabold text-primary">R$ {((order.product_value ?? 0) + (order.delivery_fee ?? 0)).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCustomerReject}
                  disabled={cancelling}
                  className="flex-1 rounded-xl border border-destructive py-3 text-sm font-bold text-destructive active:scale-[0.97] disabled:opacity-50"
                >
                  {cancelling ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "❌ Cancelar"}
                </button>
                <button
                  onClick={handleCustomerConfirm}
                  disabled={confirming}
                  className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.97] disabled:opacity-50"
                >
                  {confirming ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "✅ Confirmar"}
                </button>
              </div>
            </div>
          )}

          {order.status === "awaiting_preparation" && (
            <div className="mt-3 space-y-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <p className="text-sm text-muted-foreground">O estabelecimento está preparando seu pedido!</p>
              </div>
            </div>
          )}

          {order.status === "queued" && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  Todos os motoboys estão em entrega no momento. Seu pedido entrou na fila e será atendido em breve 👊
                </p>
              </div>
              <p className="text-sm font-semibold">
                Posição na fila: {queuePosition}º de {queueTotal}
              </p>
              <p className="text-xs text-muted-foreground">
                Tempo estimado: {5 + (queuePosition - 1) * 5} a {15 + (queuePosition - 1) * 5} minutos
              </p>
              {queueTotal >= 3 && (
                <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 mt-2">
                  <p className="text-xs font-semibold text-orange-700">
                    ⚠️ Alta demanda no momento. Pode haver demora no atendimento.
                  </p>
                </div>
              )}
            </div>
          )}
          {order.status === "pending" && (
            <div className="mt-3 space-y-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                <p className="text-sm text-muted-foreground">Procurando motoboy mais próximo...</p>
              </div>
              <p className="text-xs text-muted-foreground">Quase lá... 👊</p>
              <p className="text-sm font-medium text-foreground">⏱️ Entrega em ~20 a 30 minutos</p>
            </div>
          )}
          {(order.status === "accepted" || order.status === "picking_up") && (
            <div className="mt-3 space-y-2 text-center">
              <p className="text-lg font-bold text-primary animate-pulse">🛵 Motoboy a caminho!</p>
              <p className="text-sm font-medium text-foreground">⏱️ Entrega em ~15 a 25 minutos</p>
            </div>
          )}
          {order.status === "delivering" && (
            <div className="mt-3 space-y-2 text-center">
              <p className="text-lg font-bold text-primary animate-pulse">📦 Seu pedido está chegando!</p>
              <p className="text-sm font-medium text-foreground">⏱️ Faltam poucos minutos!</p>
            </div>
          )}
        </div>

        {/* Real-time tracking map */}
        <TrackingMap
          motoboyCoords={motoboyCoords}
          deliveryCoords={deliveryCoords}
          status={order.status}
        />

        {motoboy && order.status !== "pending" && order.status !== "cancelled" && (
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">Seu motoboy</h3>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                {motoboy.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold">{motoboy.name}</p>
                <p className="text-sm text-muted-foreground">{motoboy.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={`tel:${motoboy.phone}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary py-2.5 text-sm font-semibold active:scale-[0.97]"
              >
                <Phone className="h-4 w-4" /> Ligar
              </a>
              <button
                onClick={handleWhatsApp}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[hsl(142,70%,45%)] py-2.5 text-sm font-semibold text-white active:scale-[0.97]"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase">Detalhes do pedido</h3>
          <p className="text-sm font-bold">🛒 {order.item_description}</p>
          {order.purchase_location && <p className="text-xs text-muted-foreground">🏪 {order.purchase_location}</p>}
          <p className="text-xs text-muted-foreground">📍 {order.delivery_address}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase">Status</h3>
          <StatusStep label="Pedido criado" done />
          {order.order_type === "partner" && (
            <>
              <StatusStep
                label="Confirmação do valor"
                done={!["awaiting_confirmation"].includes(order.status)}
                active={order.status === "awaiting_confirmation"}
              />
              <StatusStep
                label="Confirmação do cliente"
                done={!["awaiting_confirmation", "awaiting_customer_confirmation"].includes(order.status)}
                active={order.status === "awaiting_customer_confirmation"}
              />
              <StatusStep
                label="Em preparo"
                done={!["awaiting_confirmation", "awaiting_customer_confirmation", "awaiting_preparation"].includes(order.status)}
                active={order.status === "awaiting_preparation"}
              />
            </>
          )}
          <StatusStep
            label="Na fila / Procurando motoboy"
            done={["accepted", "picking_up", "delivering", "completed"].includes(order.status)}
            active={["queued", "pending"].includes(order.status)}
          />
          <StatusStep
            label="Motoboy aceitou"
            done={["accepted", "picking_up", "delivering", "completed"].includes(order.status)}
            active={order.status === "pending"}
          />
          <StatusStep
            label="Entrega em andamento"
            done={["delivering", "completed"].includes(order.status)}
            active={["accepted", "picking_up"].includes(order.status)}
          />
          <StatusStep
            label="Entrega finalizada"
            done={order.status === "completed"}
            active={order.status === "delivering"}
          />
        </div>

        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive py-3 text-sm font-bold text-destructive active:scale-[0.97] disabled:opacity-50"
          >
            {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Cancelar Pedido
          </button>
        )}

        {order.status === "completed" && (
          <div className="space-y-3">
            {!hasReviewed && (
              <button
                onClick={() => setShowFeedback(true)}
                className="flex w-full items-center justify-center rounded-xl border border-primary py-3 text-sm font-bold text-primary active:scale-[0.97]"
              >
                ⭐ Avaliar entrega
              </button>
            )}
            {hasReviewed && (
              <p className="text-center text-sm text-muted-foreground">✅ Avaliação enviada! Obrigado.</p>
            )}
            <button
              onClick={() => navigate("/cliente")}
              className="flex w-full items-center justify-center rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground active:scale-[0.97]"
            >
              Fazer Novo Pedido
            </button>
          </div>
        )}
      </main>

      {showFeedback && order.motoboy_id && motoboy && (
        <FeedbackModal
          orderId={order.id}
          motoboyId={order.motoboy_id}
          motoboyName={motoboy.name}
          onClose={() => {
            setShowFeedback(false);
            setHasReviewed(true);
          }}
        />
      )}

      {pwa.canShow && !pwa.isInstalled && (
        <PWAInstallPrompt
          variant="client"
          isIOS={pwa.isIOS}
          hasNativePrompt={pwa.hasNativePrompt}
          onInstall={pwa.installNative}
          onDismiss={pwa.dismiss}
        />
      )}
    </div>
  );
};

const StatusStep = ({ label, done, active }: { label: string; done: boolean; active?: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={`h-3 w-3 rounded-full ${done ? "bg-primary" : active ? "bg-yellow-500 animate-pulse" : "bg-muted"}`} />
    <span className={`text-sm font-medium ${done ? "text-foreground" : active ? "text-foreground" : "text-muted-foreground"}`}>
      {label}
    </span>
  </div>
);

export default OrderTracking;

// Note: PWAInstallPrompt is rendered inside OrderTracking's return
