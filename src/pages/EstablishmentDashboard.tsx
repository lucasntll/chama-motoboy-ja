import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Store, LogOut, Bell, Plus, Loader2, X, MapPin, Phone, MessageCircle, CheckCircle2, Clock, Bike } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { playLoudAlarm, requestNotificationPermission } from "@/lib/notifications";
import { sendPushNotification } from "@/lib/sendPushNotification";
import { subscribeToPush } from "@/lib/pushSubscription";
import PushSetupCard from "@/components/notifications/PushSetupCard";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { dispatchOrderToMotoboys } from "@/lib/dispatchOrder";
import { clearSession } from "@/lib/session";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  item_description: string;
  house_reference: string | null;
  status: string;
  created_at: string;
  motoboy_id: string | null;
}

const STATUS_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: "Motoboy a caminho", icon: <Clock className="h-4 w-4" />, color: "bg-orange-100 text-orange-800" },
  queued: { label: "Em fila", icon: <Clock className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-800" },
  accepted: { label: "Motoboy aceitou", icon: <Bike className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
  picking_up: { label: "A caminho da retirada", icon: <Bike className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
  delivering: { label: "Em entrega", icon: <Bike className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
  completed: { label: "Finalizado", icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-green-100 text-green-700" },
};

const EstablishmentDashboard = () => {
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [motoboysMap, setMotoboysMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [houseRef, setHouseRef] = useState("");
  const [itemDescription, setItemDescription] = useState("");

  const estId = localStorage.getItem("establishment_id");
  const estName = localStorage.getItem("establishment_name");

  useEffect(() => {
    requestNotificationPermission().then(setNotifEnabled);
    if (estId && Notification.permission === "granted") {
      const cityId = localStorage.getItem("selected_city_id");
      subscribeToPush("establishment", estId, cityId);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    if (!estId) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("establishment_id", estId)
      .order("created_at", { ascending: false })
      .limit(30);
    const list = (data || []) as Order[];
    setOrders(list);

    // Fetch motoboys assigned to these orders for display
    const motoIds = Array.from(new Set(list.map((o) => o.motoboy_id).filter(Boolean))) as string[];
    if (motoIds.length > 0) {
      const { data: motos } = await supabase.from("motoboys").select("id, name, phone").in("id", motoIds);
      const map: Record<string, any> = {};
      (motos || []).forEach((m) => { map[m.id] = m; });
      setMotoboysMap(map);
    }
  }, [estId]);

  const loadData = useCallback(async () => {
    if (!estId) return;
    setLoading(true);
    const { data: est } = await supabase.from("establishments").select("*").eq("id", estId).single();
    setEstablishment(est);
    await loadOrders();
    setLoading(false);
  }, [estId, loadOrders]);

  useEffect(() => {
    if (!estId) {
      navigate("/estabelecimento-acesso", { replace: true });
      return;
    }
    loadData();

    const channel = supabase
      .channel("est-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `establishment_id=eq.${estId}` }, (payload) => {
        if (payload.eventType === "UPDATE") {
          const newRow = payload.new as any;
          const oldRow = payload.old as any;
          if (oldRow.status !== "accepted" && newRow.status === "accepted") {
            playLoudAlarm();
            toast.success("🛵 Um motoboy aceitou a corrida!", { duration: 6000 });
          }
        }
        loadOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [estId, loadData, loadOrders, navigate]);

  useRefetchOnFocus(() => loadData(), !!estId);

  const handleLogout = () => {
    clearSession();
    navigate("/", { replace: true });
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setDeliveryAddress("");
    setHouseRef("");
    setItemDescription("");
  };

  const handleCreateOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim() || !itemDescription.trim()) {
      toast.error("Preencha cliente, telefone, endereço e o que entregar");
      return;
    }
    if (!establishment) {
      toast.error("Estabelecimento não carregado");
      return;
    }

    setSubmitting(true);
    const cityId = establishment.city_id || localStorage.getItem("selected_city_id");

    const { data: inserted, error } = await supabase.from("orders").insert({
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim().replace(/\D/g, ""),
      delivery_address: deliveryAddress.trim(),
      house_reference: houseRef.trim() || null,
      item_description: itemDescription.trim(),
      service_type: "entrega",
      order_type: "partner",
      establishment_id: estId,
      establishment_commission: 2,  // R$2 por corrida finalizada
      commission_amount: 1,          // R$1 motoboy por corrida finalizada
      city_id: cityId,
      status: "pending",
      // pickup vem do estabelecimento: nome + endereço completo + bairro + referência
      purchase_location: buildPickupLocation(establishment),
    } as any).select("id").single();

    if (error || !inserted) {
      console.error(error);
      toast.error("Erro ao criar a corrida");
      setSubmitting(false);
      return;
    }

    // Despacha pra até 2 motoboys disponíveis
    const dispatched = await dispatchOrderToMotoboys(inserted.id, cityId);
    if (dispatched.length === 0) {
      await supabase.from("orders").update({ status: "queued" } as any).eq("id", inserted.id);
      toast("Nenhum motoboy disponível agora. Pedido entrou na fila 👊", { duration: 5000 });
    } else {
      toast.success(`🛵 Procurando motoboy! (${dispatched.length} avisado${dispatched.length > 1 ? "s" : ""})`);
    }

    resetForm();
    setShowForm(false);
    setSubmitting(false);
    loadOrders();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status !== "completed");
  const recentCompleted = orders.filter((o) => o.status === "completed").slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between bg-card px-4 py-3 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <Store className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base font-bold truncate">{estName}</h1>
            <p className="text-xs text-muted-foreground">{activeOrders.length} corrida(s) ativa(s)</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-full hover:bg-secondary shrink-0">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {estId && <PushSetupCard userType="establishment" referenceId={estId} />}

        {/* BOTÃO PRINCIPAL */}
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-6 text-xl font-extrabold text-primary-foreground shadow-lg active:scale-[0.97] transition-all"
        >
          <Plus className="h-7 w-7" />
          🛵 NOVA ENTREGA
        </button>

        {establishment?.address && (
          <p className="text-center text-xs text-muted-foreground">
            📍 Retirada: {establishment.address}{establishment.address_number ? `, ${establishment.address_number}` : ""}
          </p>
        )}

        {/* Lista de corridas ativas */}
        {activeOrders.length === 0 && recentCompleted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-base font-semibold text-muted-foreground">Nenhuma corrida ativa</p>
            <p className="text-sm text-muted-foreground/60">Toque em "Nova Entrega" para chamar um motoboy</p>
          </div>
        ) : (
          <>
            {activeOrders.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Corridas ativas</h2>
                {activeOrders.map((order) => {
                  const statusInfo = STATUS_LABELS[order.status] || { label: order.status, icon: null, color: "bg-gray-100" };
                  const moto = order.motoboy_id ? motoboysMap[order.motoboy_id] : null;
                  return (
                    <div key={order.id} className="rounded-2xl border bg-card p-4 space-y-3 shadow-sm overflow-hidden">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-foreground truncate">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shrink-0 ${statusInfo.color}`}>
                          {statusInfo.icon} {statusInfo.label}
                        </span>
                      </div>

                      <div className="rounded-xl bg-secondary/50 p-3 min-w-0">
                        <p className="text-sm font-medium break-words">{order.item_description}</p>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1 min-w-0">
                        <p className="break-words"><MapPin className="inline h-3 w-3 mr-1" />{order.delivery_address}</p>
                        {order.house_reference && <p className="break-words">🏠 {order.house_reference}</p>}
                        <p>📞 {order.customer_phone}</p>
                      </div>

                      {moto && (
                        <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 space-y-2">
                          <p className="text-sm font-bold text-primary flex items-center gap-2">
                            <Bike className="h-4 w-4" /> {moto.name}
                          </p>
                          <div className="flex gap-2">
                            <a
                              href={`tel:${moto.phone}`}
                              className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground"
                            >
                              <Phone className="h-3 w-3" /> Ligar
                            </a>
                            <a
                              href={`https://wa.me/${moto.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[hsl(var(--whatsapp))] py-2 text-xs font-bold text-white"
                            >
                              <MessageCircle className="h-3 w-3" /> WhatsApp
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {recentCompleted.length > 0 && (
              <div className="space-y-2 pt-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Últimas finalizadas</h2>
                {recentCompleted.map((order) => (
                  <div key={order.id} className="rounded-xl border bg-muted/30 p-3 text-xs overflow-hidden">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <p className="font-semibold truncate flex-1">{order.customer_name}</p>
                      <span className="text-green-700 font-bold shrink-0">✓ Finalizado</span>
                    </div>
                    <p className="text-muted-foreground truncate">{order.item_description}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de Nova Entrega */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
              <h2 className="text-lg font-bold">🛵 Nova Entrega</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Nome do cliente</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="mt-1 w-full rounded-xl border bg-background py-3 px-4 text-base font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Telefone do cliente</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(35) 99999-9999"
                  className="mt-1 w-full rounded-xl border bg-background py-3 px-4 text-base font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Endereço de entrega</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Rua, número, bairro"
                  className="mt-1 w-full rounded-xl border bg-background py-3 px-4 text-base font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Referência (opcional)</label>
                <input
                  type="text"
                  value={houseRef}
                  onChange={(e) => setHouseRef(e.target.value)}
                  placeholder="Ex: portão azul, ao lado da padaria"
                  className="mt-1 w-full rounded-xl border bg-background py-3 px-4 text-base font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Observação do pedido</label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Ex: 2 x-burguer + coca / remédio / documento"
                  rows={3}
                  className="mt-1 w-full rounded-xl border bg-background py-3 px-4 text-base font-medium resize-none"
                />
              </div>

              <div className="rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
                <p className="font-bold mb-1">📍 Retirada (automática):</p>
                <p>{establishment?.address || "Endereço não cadastrado"}</p>
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={submitting}
                className="w-full rounded-2xl bg-primary py-5 text-lg font-extrabold text-primary-foreground active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>🛵 CHAMAR MOTOBOY AGORA</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstablishmentDashboard;
