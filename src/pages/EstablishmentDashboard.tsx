import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store, LogOut, Bell, Package, Clock, CheckCircle, Loader2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { playLoudAlarm, requestNotificationPermission, showBrowserNotification } from "@/lib/notifications";
import { sendPushNotification } from "@/lib/sendPushNotification";
import { subscribeToPush } from "@/lib/pushSubscription";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  item_description: string;
  house_reference: string;
  status: string;
  created_at: string;
  product_value?: number | null;
  delivery_fee?: number | null;
}

const STATUS_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  awaiting_confirmation: { label: "Confirmar valor", icon: <DollarSign className="h-4 w-4" />, color: "bg-purple-100 text-purple-800" },
  pending: { label: "Novo pedido", icon: <Bell className="h-4 w-4" />, color: "bg-orange-100 text-orange-800" },
  awaiting_preparation: { label: "Novo pedido", icon: <Bell className="h-4 w-4" />, color: "bg-orange-100 text-orange-800" },
  awaiting_customer_confirmation: { label: "Aguardando cliente", icon: <Clock className="h-4 w-4" />, color: "bg-indigo-100 text-indigo-800" },
  preparing: { label: "Em preparo", icon: <Clock className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-800" },
  ready: { label: "Pronto p/ retirada", icon: <CheckCircle className="h-4 w-4" />, color: "bg-green-100 text-green-800" },
  ready_for_pickup: { label: "Pronto p/ retirada", icon: <CheckCircle className="h-4 w-4" />, color: "bg-green-100 text-green-800" },
  in_transit: { label: "Em entrega", icon: <Package className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
  completed: { label: "Finalizado", icon: <CheckCircle className="h-4 w-4" />, color: "bg-gray-100 text-gray-600" },
};

const DELIVERY_FEE = 5;

const EstablishmentDashboard = () => {
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [flashNew, setFlashNew] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [valueInputs, setValueInputs] = useState<Record<string, string>>({});

  const estId = localStorage.getItem("establishment_id");
  const estName = localStorage.getItem("establishment_name");

  useEffect(() => {
    requestNotificationPermission().then(setNotifEnabled);
    // Also subscribe to push if permission already granted
    if (estId && Notification.permission === "granted") {
      const cityId = localStorage.getItem("selected_city_id");
      subscribeToPush("establishment", estId, cityId);
    }
  }, []);

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
          playLoudAlarm();
          showBrowserNotification(
            "🔔 NOVO PEDIDO!",
            `Pedido de ${(payload.new as any)?.customer_name || "cliente"} recebido!`
          );
          setFlashNew(true);
          setTimeout(() => setFlashNew(false), 3000);
          toast("🔔 NOVO PEDIDO RECEBIDO!", { duration: 8000 });
          // Vibration is now handled inside playLoudAlarm for a prolonged pattern
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
      .in("status", ["awaiting_confirmation", "awaiting_customer_confirmation", "awaiting_preparation", "preparing", "ready_for_pickup", "ready", "in_transit", "pending", "accepted", "delivering"])
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

  const confirmOrderValue = async (orderId: string) => {
    const rawValue = valueInputs[orderId];
    if (!rawValue || isNaN(Number(rawValue.replace(",", "."))) || Number(rawValue.replace(",", ".")) <= 0) {
      toast.error("Insira um valor válido para os produtos");
      return;
    }
    const productValue = Number(rawValue.replace(",", "."));
    await supabase.from("orders").update({
      product_value: productValue,
      delivery_fee: DELIVERY_FEE,
      status: "awaiting_customer_confirmation",
    } as any).eq("id", orderId);

    // Find order to get customer phone
    const order = orders.find(o => o.id === orderId);
    if (order) {
      sendPushNotification({
        event: "value_defined",
        order_id: orderId,
        customer_phone: order.customer_phone,
      });
    }

    toast.success("Valor enviado para confirmação do cliente!");
    setValueInputs((prev) => { const n = { ...prev }; delete n[orderId]; return n; });
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
    <div className={`flex min-h-screen flex-col bg-background transition-all ${flashNew ? "animate-pulse ring-4 ring-orange-500" : ""}`}>
      <header className="flex items-center justify-between bg-card px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Store className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-base font-bold">{estName}</h1>
            <p className="text-xs text-muted-foreground">{activeOrders.length} pedido(s) ativo(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!notifEnabled && (
            <button
              onClick={async () => {
                const cityId = localStorage.getItem("selected_city_id");
                const result = await subscribeToPush("establishment", estId!, cityId);
                setNotifEnabled(result.success);
                if (result.success) toast.success("Notificações ativadas!");
                else if (result.reason === "denied") toast.error("Notificações bloqueadas. Ative nas configurações do navegador.");
                else toast.error("Não foi possível ativar notificações.");
              }}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground animate-pulse"
            >
              <Bell className="h-3 w-3" /> Ativar alertas
            </button>
          )}
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

                <div className="flex flex-col gap-2">
                  {/* Step 1: Establishment confirms product value */}
                  {order.status === "awaiting_confirmation" && (
                    <div className="space-y-2 rounded-xl border-2 border-purple-300 bg-purple-50 p-3">
                      <p className="text-xs font-bold text-purple-800">💰 Informe o valor total dos produtos:</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-purple-700">R$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={valueInputs[order.id] || ""}
                          onChange={(e) => setValueInputs((prev) => ({ ...prev, [order.id]: e.target.value }))}
                          className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                      <p className="text-[10px] text-purple-600">Frete: R$ {DELIVERY_FEE.toFixed(2)} será adicionado automaticamente</p>
                      <button
                        onClick={() => confirmOrderValue(order.id)}
                        className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-bold text-white active:scale-[0.97]"
                      >
                        💲 Confirmar Valor do Pedido
                      </button>
                    </div>
                  )}

                  {/* Step 2: Waiting for customer confirmation */}
                  {order.status === "awaiting_customer_confirmation" && (
                    <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 space-y-1">
                      <p className="text-xs font-bold text-indigo-700">⏳ Aguardando confirmação do cliente</p>
                      <p className="text-xs text-indigo-600">
                        Produtos: R$ {(order.product_value ?? 0).toFixed(2)} + Frete: R$ {(order.delivery_fee ?? DELIVERY_FEE).toFixed(2)} = <span className="font-bold">R$ {((order.product_value ?? 0) + (order.delivery_fee ?? DELIVERY_FEE)).toFixed(2)}</span>
                      </p>
                    </div>
                  )}

                  {/* Regular flow after customer confirms */}
                  {(order.status === "awaiting_preparation" || order.status === "pending") && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "preparing")}
                      className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground active:scale-[0.97]"
                    >
                      🔥 Iniciar Preparo
                    </button>
                  )}
                  {order.status === "preparing" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "ready_for_pickup")}
                      className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground active:scale-[0.97]"
                    >
                      ✅ Pedido Pronto
                    </button>
                  )}
                  {order.status === "ready_for_pickup" && (
                    <p className="flex-1 text-center text-xs font-semibold text-muted-foreground py-2.5">
                      ⏳ Aguardando motoboy retirar...
                    </p>
                  )}
                  {["accepted", "delivering"].includes(order.status) && (
                    <p className="flex-1 text-center text-xs font-semibold text-muted-foreground py-2.5">
                      🛵 Motoboy a caminho / em entrega
                    </p>
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
