import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store, LogOut, Bell, Loader2, MapPin, Phone, MessageCircle,
  CheckCircle2, Clock, Bike, Zap, History, RotateCcw, AlertTriangle, X, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { playLoudAlarm, requestNotificationPermission } from "@/lib/notifications";
import { subscribeToPush } from "@/lib/pushSubscription";
import PushSetupCard from "@/components/notifications/PushSetupCard";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { dispatchOrderToMotoboys } from "@/lib/dispatchOrder";
import { clearSession } from "@/lib/session";
import NewDeliveryModal from "@/components/establishment/NewDeliveryModal";
import DaySummary from "@/components/establishment/DaySummary";
import HistoryModal from "@/components/establishment/HistoryModal";
import { saveCustomer, type SavedCustomer } from "@/lib/establishmentCustomers";

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
  dispatched_at: string | null;
  completed_at: string | null;
  establishment_commission: number | null;
}

const STATUS_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: "Procurando motoboy", icon: <Clock className="h-4 w-4" />, color: "bg-orange-100 text-orange-800" },
  queued: { label: "Em fila", icon: <Clock className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-800" },
  accepted: { label: "Motoboy aceitou", icon: <Bike className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
  picking_up: { label: "Indo retirar", icon: <Bike className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
  delivering: { label: "Em entrega", icon: <Bike className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
  completed: { label: "Finalizado", icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada", icon: <X className="h-4 w-4" />, color: "bg-red-100 text-red-700" },
};

const buildPickupLocation = (est: any): string => {
  if (!est) return "";
  const parts: string[] = [];
  if (est.name) parts.push(est.name);
  const addr = [est.address, est.address_number].filter(Boolean).join(", ");
  if (addr) parts.push(addr);
  if (est.neighborhood) parts.push(est.neighborhood);
  if (est.complement) parts.push(`Ref: ${est.complement}`);
  return parts.join(" — ");
};

const isToday = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

const minutesBetween = (a: string, b: string) => {
  const diff = (new Date(b).getTime() - new Date(a).getTime()) / 60000;
  return Math.max(0, Math.round(diff));
};

const EstablishmentDashboard = () => {
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [motoboysMap, setMotoboysMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"fast" | "full">("fast");
  const [prefill, setPrefill] = useState<Partial<SavedCustomer> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [failsafeOrderId, setFailsafeOrderId] = useState<string | null>(null);
  const [, forceTick] = useState(0);
  const failsafeTimerRef = useRef<number | null>(null);

  const estId = localStorage.getItem("establishment_id");
  const estName = localStorage.getItem("establishment_name");
  const hiddenKey = `est:${estId}:hidden_recent`;
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(hiddenKey) || "[]"); } catch { return []; }
  });

  useEffect(() => {
    requestNotificationPermission();
    if (estId && Notification.permission === "granted") {
      const cityId = localStorage.getItem("selected_city_id");
      subscribeToPush("establishment", estId, cityId);
    }
  }, [estId]);

  // Tick a cada 10s pra refrescar contagem do failsafe
  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 10000);
    return () => window.clearInterval(id);
  }, []);

  const loadOrders = useCallback(async () => {
    if (!estId) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("establishment_id", estId)
      .order("created_at", { ascending: false })
      .limit(50);
    const list = (data || []) as Order[];
    setOrders(list);

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
            // se era o pedido em failsafe, limpa
            if (failsafeOrderId === newRow.id) setFailsafeOrderId(null);
          }
        }
        loadOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [estId, loadData, loadOrders, navigate, failsafeOrderId]);

  useRefetchOnFocus(() => loadData(), !!estId);

  const handleLogout = () => {
    clearSession();
    navigate("/", { replace: true });
  };

  // ====== Resumo do dia ======
  const todayCompleted = useMemo(
    () => orders.filter((o) => o.status === "completed" && o.completed_at && isToday(o.completed_at)),
    [orders],
  );
  const todayCount = todayCompleted.length;
  const todayTotal = todayCompleted.reduce((acc, o) => acc + Number(o.establishment_commission || 0), 0);
  const todayAvg = useMemo(() => {
    if (todayCompleted.length === 0) return null;
    const mins = todayCompleted.map((o) => minutesBetween(o.created_at, o.completed_at!));
    return Math.round(mins.reduce((a, b) => a + b, 0) / mins.length);
  }, [todayCompleted]);

  // ====== Failsafe 60s ======
  const startFailsafe = useCallback((orderId: string) => {
    if (failsafeTimerRef.current) window.clearTimeout(failsafeTimerRef.current);
    setFailsafeOrderId(null);
    failsafeTimerRef.current = window.setTimeout(async () => {
      // Verifica se ainda está sem motoboy
      const { data } = await supabase.from("orders").select("status, motoboy_id").eq("id", orderId).single();
      if (data && !data.motoboy_id && (data.status === "pending" || data.status === "queued")) {
        setFailsafeOrderId(orderId);
        playLoudAlarm();
      }
    }, 60000);
  }, []);

  const handleCreateOrder = async (data: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    houseRef: string;
    itemDescription: string;
  }) => {
    if (!data.customerName.trim()) {
      toast.error("Preencha pelo menos o nome do cliente");
      return;
    }
    if (!establishment) {
      toast.error("Estabelecimento não carregado");
      return;
    }

    setSubmitting(true);
    const cityId = establishment.city_id || localStorage.getItem("selected_city_id");

    const { data: inserted, error } = await supabase.from("orders").insert({
      customer_name: data.customerName.trim(),
      customer_phone: (data.customerPhone || "").trim().replace(/\D/g, ""),
      delivery_address: data.deliveryAddress.trim(),
      house_reference: data.houseRef.trim() || null,
      item_description: (data.itemDescription || "").trim() || "Entrega",
      service_type: "entrega",
      order_type: "partner",
      establishment_id: estId,
      establishment_commission: 2,
      commission_amount: 1,
      city_id: cityId,
      status: "pending",
      purchase_location: buildPickupLocation(establishment),
    } as any).select("id").single();

    if (error || !inserted) {
      console.error(error);
      toast.error("Erro ao criar a corrida");
      setSubmitting(false);
      return;
    }

    // Salva cliente no localStorage
    if (estId) {
      saveCustomer(estId, {
        name: data.customerName.trim(),
        phone: data.customerPhone.trim(),
        address: data.deliveryAddress.trim(),
        reference: data.houseRef.trim(),
        note: data.itemDescription.trim(),
      });
    }

    const dispatched = await dispatchOrderToMotoboys(inserted.id, cityId);
    if (dispatched.length === 0) {
      await supabase.from("orders").update({ status: "queued" } as any).eq("id", inserted.id);
      toast("Nenhum motoboy disponível agora. Pedido entrou na fila 👊", { duration: 5000 });
    } else {
      toast.success(`🛵 Procurando motoboy! (${dispatched.length} avisado${dispatched.length > 1 ? "s" : ""})`);
    }

    // Inicia failsafe 60s
    startFailsafe(inserted.id);

    setShowForm(false);
    setPrefill(null);
    setSubmitting(false);
    loadOrders();
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Cancelar essa entrega? Não será cobrada.")) return;
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled", motoboy_id: null } as any)
      .eq("id", orderId)
      .in("status", ["pending", "queued", "accepted"]);
    if (error) {
      toast.error("Erro ao cancelar");
      return;
    }
    toast.success("Entrega cancelada");
    if (failsafeOrderId === orderId) setFailsafeOrderId(null);
    loadOrders();
  };

  const handleRetryFailsafe = async () => {
    if (!failsafeOrderId) return;
    const cityId = establishment?.city_id || localStorage.getItem("selected_city_id");
    await supabase.from("orders").update({ status: "pending", dispatched_to: [] } as any).eq("id", failsafeOrderId);
    const dispatched = await dispatchOrderToMotoboys(failsafeOrderId, cityId);
    if (dispatched.length === 0) {
      toast("Ainda sem motoboy disponível. Pedido na fila.", { duration: 4000 });
    } else {
      toast.success("Buscando motoboy novamente...");
    }
    startFailsafe(failsafeOrderId);
    setFailsafeOrderId(null);
    loadOrders();
  };

  const handleRedo = (o: Order) => {
    setPrefill({
      name: o.customer_name,
      phone: o.customer_phone || "",
      address: o.delivery_address,
      reference: o.house_reference || "",
      note: o.item_description || "",
    });
    setFormMode("full");
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeOrders = orders.filter((o) => !["completed", "cancelled"].includes(o.status));
  const hiddenKey = `est:${estId}:hidden_recent`;
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(hiddenKey) || "[]"); } catch { return []; }
  });
  const recent = orders
    .filter((o) => ["completed", "cancelled"].includes(o.status))
    .filter((o) => !hiddenIds.includes(o.id))
    .slice(0, 5);

  const hideRecent = (id: string) => {
    const next = Array.from(new Set([...hiddenIds, id]));
    setHiddenIds(next);
    localStorage.setItem(hiddenKey, JSON.stringify(next));
    toast.success("Entrega removida da lista. A taxa continua salva no painel admin.");
  };

  const clearAllRecent = () => {
    if (!confirm("Apagar todas as entregas finalizadas da lista? (As taxas continuam salvas no painel do admin)")) return;
    const ids = orders.filter((o) => ["completed", "cancelled"].includes(o.status)).map((o) => o.id);
    const next = Array.from(new Set([...hiddenIds, ...ids]));
    setHiddenIds(next);
    localStorage.setItem(hiddenKey, JSON.stringify(next));
  };

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
        <div className="flex items-center gap-1">
          <button onClick={() => setShowHistory(true)} className="p-2 rounded-full hover:bg-secondary" aria-label="Histórico">
            <History className="h-4 w-4" />
          </button>
          <button onClick={handleLogout} className="p-2 rounded-full hover:bg-secondary" aria-label="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {estId && <PushSetupCard userType="establishment" referenceId={estId} />}

        {/* Resumo do dia */}
        <DaySummary count={todayCount} totalFee={todayTotal} avgMinutes={todayAvg} />

        {/* Failsafe banner */}
        {failsafeOrderId && (
          <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-4 space-y-3 animate-pulse">
            <p className="text-sm font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Nenhum motoboy disponível no momento
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRetryFailsafe}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
              >
                🔄 Tentar novamente
              </button>
              <button
                onClick={() => handleCancelOrder(failsafeOrderId)}
                className="flex-1 rounded-xl border-2 border-destructive py-3 text-sm font-bold text-destructive"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Botões principais */}
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => { setPrefill(null); setFormMode("fast"); setShowForm(true); }}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-6 text-xl font-extrabold text-primary-foreground shadow-lg active:scale-[0.97] transition-all"
          >
            <Zap className="h-7 w-7" />
            ⚡ ENTREGA RÁPIDA
          </button>
          <button
            onClick={() => { setPrefill(null); setFormMode("full"); setShowForm(true); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/30 bg-card py-3 text-sm font-bold text-primary active:scale-[0.97] transition-all"
          >
            📝 Nova entrega completa
          </button>
        </div>

        {/* Lista ativa */}
        {activeOrders.length === 0 && recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-base font-semibold text-muted-foreground">Nenhuma corrida ativa</p>
            <p className="text-sm text-muted-foreground/60">Toque em "Entrega Rápida" para chamar um motoboy</p>
          </div>
        ) : (
          <>
            {activeOrders.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Corridas ativas</h2>
                {activeOrders.map((order) => {
                  const statusInfo = STATUS_LABELS[order.status] || { label: order.status, icon: null, color: "bg-gray-100" };
                  const moto = order.motoboy_id ? motoboysMap[order.motoboy_id] : null;
                  const canCancel = ["pending", "queued", "accepted"].includes(order.status);
                  const eta = order.status === "accepted" ? 4 : order.status === "picking_up" ? 6 : order.status === "delivering" ? 8 : null;
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
                        {order.customer_phone && <p>📞 {order.customer_phone}</p>}
                      </div>

                      {moto && (
                        <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-primary flex items-center gap-2">
                              <Bike className="h-4 w-4" /> {moto.name}
                            </p>
                            {eta && (
                              <span className="text-xs font-bold text-primary">⏱ ~{eta} min</span>
                            )}
                          </div>
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

                      {canCancel && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="w-full rounded-xl border-2 border-destructive/40 py-2.5 text-xs font-bold text-destructive active:scale-[0.97]"
                        >
                          ❌ CANCELAR ENTREGA
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {recent.length > 0 && (
              <div className="space-y-2 pt-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Últimas entregas</h2>
                {recent.map((order) => (
                  <div key={order.id} className="rounded-xl border bg-muted/30 p-3 text-xs overflow-hidden space-y-2">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <p className="font-semibold truncate flex-1">{order.customer_name}</p>
                      <span className={order.status === "completed" ? "text-green-700 font-bold shrink-0" : "text-destructive font-bold shrink-0"}>
                        {order.status === "completed" ? "✓ Finalizado" : "✕ Cancelada"}
                      </span>
                    </div>
                    <p className="text-muted-foreground truncate">{order.delivery_address}</p>
                    <button
                      onClick={() => handleRedo(order)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary/10 border border-primary/30 py-2 text-xs font-bold text-primary active:scale-[0.97]"
                    >
                      <RotateCcw className="h-3 w-3" /> REFAZER ENTREGA
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showForm && estId && (
        <NewDeliveryModal
          estId={estId}
          establishment={establishment}
          initialMode={formMode}
          prefill={prefill}
          submitting={submitting}
          onClose={() => { setShowForm(false); setPrefill(null); }}
          onSubmit={handleCreateOrder}
        />
      )}

      {showHistory && estId && (
        <HistoryModal estId={estId} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
};

export default EstablishmentDashboard;