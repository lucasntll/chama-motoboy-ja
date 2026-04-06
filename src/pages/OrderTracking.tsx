import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Phone, MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; emoji: string; color: string }> = {
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
  const [order, setOrder] = useState<any>(null);
  const [motoboy, setMotoboy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = async () => {
    if (!orderId) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (data) {
      setOrder(data);
      if (data.motoboy_id) {
        const { data: m } = await supabase
          .from("motoboys")
          .select("name, phone")
          .eq("id", data.motoboy_id)
          .maybeSingle();
        setMotoboy(m);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // Realtime updates
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

  const handleCancel = async () => {
    if (!orderId || !order) return;
    setCancelling(true);
    await supabase.from("orders").update({ status: "cancelled" } as any).eq("id", orderId);
    toast.success("Pedido cancelado");
    setCancelling(false);
    fetchOrder();
  };

  const openWhatsApp = () => {
    if (!motoboy?.phone) return;
    const phone = motoboy.phone.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${motoboy.name}, estou acompanhando meu pedido!`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
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
  const canCancel = order.status === "pending";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate("/")} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Acompanhar Pedido</h1>
      </header>

      <main className="flex-1 px-4 py-6 space-y-5">
        {/* Status principal */}
        <div className="flex flex-col items-center text-center py-6">
          <span className="text-5xl mb-4">{status.emoji}</span>
          <h2 className={`text-xl font-bold ${status.color}`}>{status.label}</h2>
          {order.status === "pending" && (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              <p className="text-sm text-muted-foreground">Aguardando um motoboy aceitar...</p>
            </div>
          )}
        </div>

        {/* Motoboy info (após aceitação) */}
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
                onClick={openWhatsApp}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[hsl(142,70%,45%)] py-2.5 text-sm font-semibold text-white active:scale-[0.97]"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* Order details */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase">Detalhes do pedido</h3>
          <p className="text-sm font-bold">🛒 {order.item_description}</p>
          {order.purchase_location && <p className="text-xs text-muted-foreground">🏪 {order.purchase_location}</p>}
          <p className="text-xs text-muted-foreground">📍 {order.delivery_address}</p>
        </div>

        {/* Status timeline */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase">Status</h3>
          <StatusStep label="Pedido criado" done />
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

        {/* Cancel button */}
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
          <button
            onClick={() => navigate("/cliente")}
            className="flex w-full items-center justify-center rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground active:scale-[0.97]"
          >
            Fazer Novo Pedido
          </button>
        )}
      </main>
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
