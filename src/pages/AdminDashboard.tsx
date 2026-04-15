import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Loader2, Ban, CheckCircle, DollarSign, Users, Package, Calendar, ChevronDown, ChevronUp, Star, UserPlus, X, Eye, MapPin, Store, Plus, Trash2, TrendingUp, BarChart3, Copy, Pill, LayoutGrid } from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Tab = "motoboys" | "orders" | "payments" | "feedback" | "applications" | "cities" | "establishments" | "financeiro" | "farmacias" | "categorias";

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") !== "true") {
      navigate("/login", { replace: true });
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    navigate("/login", { replace: true });
  };

  const [tab, setTab] = useState<Tab>("motoboys");
  const [motoboys, setMotoboys] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [estApplications, setEstApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [expandedMotoboy, setExpandedMotoboy] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [newCityName, setNewCityName] = useState("");
  const [newCityState, setNewCityState] = useState("MG");
  const [removingEstId, setRemovingEstId] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [m, o, r, a, c, e, ea] = await Promise.all([
      supabase.from("motoboys").select("*").order("name"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("reviews" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("motoboy_applications" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("cities").select("*").order("name"),
      supabase.from("establishments").select("*").order("name"),
      supabase.from("establishment_applications").select("*").order("created_at", { ascending: false }),
    ]);
    setMotoboys(m.data || []);
    setOrders(o.data || []);
    setReviews(r.data || []);
    setApplications(a.data || []);
    setCities(c.data || []);
    setEstablishments(e.data || []);
    setEstApplications(ea.data || []);
    setLoading(false);
  };

  const filteredOrders = useMemo(() => {
    if (!dateFilter) return orders;
    return orders.filter((o) => {
      const d = new Date(o.completed_at || o.created_at).toISOString().slice(0, 10);
      return d === dateFilter;
    });
  }, [orders, dateFilter]);

  const getMotoboyStats = (motoboyId: string) => {
    const motoboyOrders = filteredOrders.filter((o) => o.motoboy_id === motoboyId && o.status === "completed");
    const totalRides = motoboyOrders.length;
    const totalCommission = totalRides * 2;
    const paidOrders = motoboyOrders.filter((o: any) => o.is_paid);
    const totalPaid = paidOrders.length * 2;
    const owed = totalCommission - totalPaid;
    const motoboyReviews = reviews.filter((r: any) => r.motoboy_id === motoboyId);
    const avgRating = motoboyReviews.length > 0
      ? (motoboyReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / motoboyReviews.length).toFixed(1)
      : "—";
    return { totalRides, totalCommission, owed, avgRating, reviewCount: motoboyReviews.length };
  };

  const getMotoboyDailyBreakdown = (motoboyId: string) => {
    const completed = orders.filter((o) => o.motoboy_id === motoboyId && o.status === "completed");
    const groups: Record<string, { label: string; rides: number; amount: number }> = {};
    completed.forEach((o) => {
      const d = new Date(o.completed_at || o.created_at);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("pt-BR");
      if (!groups[key]) groups[key] = { label, rides: 0, amount: 0 };
      groups[key].rides++;
      groups[key].amount += 2;
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)).map(([, v]) => v);
  };

  const toggleBlock = async (motoboy: any) => {
    const newAvailable = !motoboy.is_available;
    await supabase.from("motoboys").update({
      is_available: newAvailable,
      status: newAvailable ? "available" : "inactive",
    }).eq("id", motoboy.id);
    toast({ title: newAvailable ? "Motoboy desbloqueado" : "Motoboy bloqueado" });
    fetchData();
  };

  const markAsPaid = async (motoboyId: string) => {
    const unpaid = orders.filter((o) => o.motoboy_id === motoboyId && o.status === "completed" && !o.is_paid);
    for (const order of unpaid) {
      await supabase.from("orders").update({ is_paid: true } as any).eq("id", order.id);
    }
    if (unpaid.length > 0) {
      await supabase.from("payments" as any).insert({
        motoboy_id: motoboyId,
        amount: unpaid.length * 2,
        admin_note: `Pagamento de ${unpaid.length} corridas`,
      });
    }
    toast({ title: `Pagamento registrado! ${unpaid.length} corridas` });
    fetchData();
  };

  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const cleanupHistory = async () => {
    setCleaning(true);
    await supabase.from("orders").delete().eq("status", "completed");
    toast({ title: "Histórico de corridas finalizadas apagado com sucesso!" });
    setShowCleanupConfirm(false);
    setCleaning(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalCompletedOrders = orders.filter((o) => o.status === "completed").length;
  const motoboyRevenue = totalCompletedOrders * 2;
  const partnerOrders = orders.filter((o) => o.status === "completed" && o.order_type === "partner");
  const estRevenue = partnerOrders.length * 2;
  const totalRevenue = motoboyRevenue + estRevenue;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between bg-card px-4 py-3 border-b">
        <div>
          <h1 className="text-lg font-bold">Painel Admin</h1>
          <p className="text-xs text-muted-foreground">ChamaMotoboy</p>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-secondary">
          <LogOut className="h-5 w-5 text-muted-foreground" />
        </button>
      </header>

      {(() => {
        const availableCount = motoboys.filter((m) => m.status === "available" && m.is_available).length;
        const busyCount = motoboys.filter((m) => m.status === "busy").length;
        const activeOrders = orders.filter((o) => ["accepted", "picking_up", "delivering"].includes(o.status)).length;
        const queuedOrders = orders.filter((o) => o.status === "queued").length;
        const pendingOrders = orders.filter((o) => o.status === "pending").length;
        return (
          <div className="px-4 py-3 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border bg-card p-3 text-center">
                <p className="text-lg font-bold">{totalCompletedOrders}</p>
                <p className="text-[10px] text-muted-foreground">Corridas</p>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center">
                <p className="text-lg font-bold text-primary">R${totalRevenue}</p>
                <p className="text-[10px] text-muted-foreground">Comissões</p>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center">
                <p className="text-lg font-bold">{motoboys.length}</p>
                <p className="text-[10px] text-muted-foreground">Motoboys</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-lg border bg-card p-2 text-center">
                <p className="text-sm font-bold text-green-600">🟢 {availableCount}</p>
                <p className="text-[9px] text-muted-foreground">Disponíveis</p>
              </div>
              <div className="rounded-lg border bg-card p-2 text-center">
                <p className="text-sm font-bold text-red-500">🔴 {busyCount}</p>
                <p className="text-[9px] text-muted-foreground">Em corrida</p>
              </div>
              <div className="rounded-lg border bg-card p-2 text-center">
                <p className="text-sm font-bold text-blue-600">📦 {activeOrders + pendingOrders}</p>
                <p className="text-[9px] text-muted-foreground">Andamento</p>
              </div>
              <div className="rounded-lg border bg-card p-2 text-center">
                <p className={`text-sm font-bold ${queuedOrders > 0 ? "text-orange-600" : ""}`}>⏳ {queuedOrders}</p>
                <p className="text-[9px] text-muted-foreground">Na fila</p>
              </div>
            </div>
            {queuedOrders >= 3 && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2">
                <p className="text-xs font-semibold text-orange-700">⚠️ Alta demanda! {queuedOrders} pedidos aguardando na fila.</p>
              </div>
            )}
          </div>
        );
      })()}

      <div className="px-4 pb-2 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="flex-1 rounded-lg border bg-card px-3 py-2 text-sm"
        />
        {dateFilter && (
          <button onClick={() => setDateFilter("")} className="text-xs text-primary font-medium">
            Limpar
          </button>
        )}
      </div>

      <div className="flex border-b px-4 overflow-x-auto">
        {([
          { key: "motoboys" as Tab, label: "Motoboys", icon: Users },
          { key: "orders" as Tab, label: "Corridas", icon: Package },
          { key: "payments" as Tab, label: "Pagamentos", icon: DollarSign },
          { key: "feedback" as Tab, label: "Feedback", icon: Star },
          { key: "applications" as Tab, label: "Solicitações", icon: UserPlus },
          { key: "cities" as Tab, label: "Cidades", icon: MapPin },
          { key: "establishments" as Tab, label: "Parceiros", icon: Store },
          { key: "farmacias" as Tab, label: "Farmácias", icon: Pill },
          { key: "categorias" as Tab, label: "Categorias", icon: LayoutGrid },
          { key: "financeiro" as Tab, label: "Financeiro", icon: TrendingUp },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <main className="flex-1 px-4 py-3 space-y-3 overflow-y-auto pb-6">
        {tab === "motoboys" && motoboys.map((m) => {
          const stats = getMotoboyStats(m.id);
          const isExpanded = expandedMotoboy === m.id;
          const dailyBreakdown = isExpanded ? getMotoboyDailyBreakdown(m.id) : [];
          return (
            <div key={m.id} className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.phone} • {m.vehicle}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  m.status === "available" ? "bg-green-100 text-green-700" :
                  m.status === "busy" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {m.status === "available" ? "Disponível" : m.status === "busy" ? "Ocupado" : "Inativo"}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center">
                <div>
                  <p className="text-xs font-bold">{stats.totalRides}</p>
                  <p className="text-[9px] text-muted-foreground">Corridas</p>
                </div>
                <div>
                  <p className="text-xs font-bold">R${stats.totalCommission}</p>
                  <p className="text-[9px] text-muted-foreground">Comissão</p>
                </div>
                <div>
                  <p className={`text-xs font-bold ${stats.owed > 0 ? "text-destructive" : "text-primary"}`}>
                    R${stats.owed}
                  </p>
                  <p className="text-[9px] text-muted-foreground">Deve</p>
                </div>
                <div>
                  <p className="text-xs font-bold">⭐ {stats.avgRating}</p>
                  <p className="text-[9px] text-muted-foreground">{stats.reviewCount} aval.</p>
                </div>
              </div>

              <button
                onClick={() => setExpandedMotoboy(isExpanded ? null : m.id)}
                className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground py-1"
              >
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {isExpanded ? "Ocultar detalhes" : "Ver por dia"}
              </button>

              {isExpanded && dailyBreakdown.length > 0 && (
                <div className="space-y-1 border-t pt-2">
                  {dailyBreakdown.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-1">
                      <span className="text-muted-foreground">{d.label}</span>
                      <span className="font-medium">{d.rides} corridas — R${d.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => markAsPaid(m.id)}
                  disabled={stats.owed <= 0}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground disabled:opacity-40 active:scale-[0.97]"
                >
                  <CheckCircle className="h-3 w-3" /> Marcar Pago
                </button>
                <button
                  onClick={() => toggleBlock(m)}
                  className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold active:scale-[0.97] ${
                    m.is_available ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <Ban className="h-3 w-3" /> {m.is_available ? "Bloquear" : "Desbloquear"}
                </button>
              </div>
            </div>
          );
        })}

        {tab === "orders" && filteredOrders.map((o) => {
          const motoboy = motoboys.find((m) => m.id === o.motoboy_id);
          const d = new Date(o.created_at);
          return (
            <div key={o.id} className="rounded-xl border bg-card p-3 space-y-1">
              <div className="flex items-start justify-between">
                <p className="text-sm font-bold">{o.item_description}</p>
                <span className="text-xs text-muted-foreground">
                  {d.toLocaleDateString("pt-BR")} {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">📍 {o.delivery_address}</p>
              <p className="text-xs text-muted-foreground">👤 {o.customer_name} • {o.customer_phone}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">🏍️ {motoboy?.name || "—"}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  o.status === "completed" ? "bg-green-100 text-green-700" :
                  o.status === "queued" ? "bg-orange-100 text-orange-700" :
                  o.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                  o.status === "cancelled" ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {o.status === "queued" ? "Na fila" : o.status === "pending" ? "Aguardando" : o.status}
                </span>
              </div>
            </div>
          );
        })}

        {tab === "payments" && motoboys.map((m) => {
          const stats = getMotoboyStats(m.id);
          if (stats.totalRides === 0) return null;
          return (
            <div key={m.id} className="rounded-xl border bg-card p-4 space-y-2">
              <p className="text-sm font-bold">{m.name}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total comissão:</span>
                <span className="font-bold">R${stats.totalCommission}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor devido:</span>
                <span className={`font-bold ${stats.owed > 0 ? "text-destructive" : "text-primary"}`}>R${stats.owed}</span>
              </div>
              {stats.owed > 0 && (
                <button
                  onClick={() => markAsPaid(m.id)}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.97]"
                >
                  Marcar como Pago (R${stats.owed})
                </button>
              )}
            </div>
          );
        })}

        {tab === "feedback" && (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <span className="text-4xl mb-3">⭐</span>
                <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>
              </div>
            ) : (
              reviews.map((r: any) => {
                const m = motoboys.find((mb) => mb.id === r.motoboy_id);
                const d = new Date(r.created_at);
                return (
                  <div key={r.id} className="rounded-xl border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">🏍️ {m?.name || "—"}</p>
                      <span className="text-xs text-muted-foreground">
                        {d.toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                        />
                      ))}
                      <span className="text-sm font-bold ml-1">{r.rating}/5</span>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-muted-foreground italic">"{r.comment}"</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "applications" && (
          <div className="space-y-3">
            {applications.filter((a: any) => a.status === "pending").length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <UserPlus className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>
              </div>
            )}
            {applications.map((app: any) => {
              const d = new Date(app.created_at);
              return (
                <div key={app.id} className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold">{app.full_name}</p>
                      <p className="text-xs text-muted-foreground">{app.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        app.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        app.status === "approved" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {app.status === "pending" ? "Pendente" : app.status === "approved" ? "Aprovado" : "Recusado"}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-1">{d.toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <p><span className="text-muted-foreground">Cidade:</span> {app.city}</p>
                    <p><span className="text-muted-foreground">Veículo:</span> {app.vehicle_type}</p>
                    <p className="col-span-2"><span className="text-muted-foreground">Endereço:</span> {app.address}</p>
                    {app.experience && <p className="col-span-2"><span className="text-muted-foreground">Experiência:</span> {app.experience}</p>}
                  </div>
                  <div className="flex gap-2">
                    {app.face_photo_url && (
                      <button onClick={() => setViewingPhoto(app.face_photo_url)} className="flex items-center gap-1 text-xs text-primary font-medium">
                        <Eye className="h-3 w-3" /> Foto rosto
                      </button>
                    )}
                    {app.vehicle_photo_url && (
                      <button onClick={() => setViewingPhoto(app.vehicle_photo_url)} className="flex items-center gap-1 text-xs text-primary font-medium">
                        <Eye className="h-3 w-3" /> Foto veículo
                      </button>
                    )}
                  </div>
                  {app.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          // Check duplicate phone
                          const { data: existing } = await supabase.from("motoboys").select("id").eq("phone", app.phone).maybeSingle();
                          if (existing) {
                            toast({ title: "Motoboy com este telefone já existe!", variant: "destructive" });
                            return;
                          }
                          // Generate access code: firstName + 123
                          const firstName = app.full_name.split(" ")[0];
                          const accessCode = `${firstName}123`;
                          await supabase.from("motoboys").insert({
                            name: app.full_name,
                            phone: app.phone,
                            region: app.city,
                            vehicle: app.vehicle_type,
                            photo: app.face_photo_url || "",
                            access_code: accessCode,
                          });
                          await supabase.from("motoboy_applications" as any).update({ status: "approved" }).eq("id", app.id);
                          toast({ title: `${app.full_name} aprovado! Código: ${accessCode}` });
                          fetchData();
                        }}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground active:scale-[0.97]"
                      >
                        <CheckCircle className="h-3 w-3" /> Aprovar
                      </button>
                      <button
                        onClick={async () => {
                          await supabase.from("motoboy_applications" as any).update({ status: "rejected" }).eq("id", app.id);
                          toast({ title: `${app.full_name} recusado` });
                          fetchData();
                        }}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-destructive py-2 text-xs font-bold text-destructive-foreground active:scale-[0.97]"
                      >
                        <X className="h-3 w-3" /> Recusar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "cities" && (
          <div className="space-y-3">
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h3 className="text-sm font-bold">Adicionar cidade</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="Nome da cidade"
                  className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={newCityState}
                  onChange={(e) => setNewCityState(e.target.value)}
                  placeholder="UF"
                  className="w-16 rounded-lg border bg-background px-3 py-2 text-sm text-center"
                  maxLength={2}
                />
                <button
                  onClick={async () => {
                    if (!newCityName.trim()) return;
                    await supabase.from("cities").insert({ name: newCityName.trim(), state: newCityState.trim().toUpperCase() || "MG" });
                    setNewCityName("");
                    toast({ title: `Cidade ${newCityName} adicionada!` });
                    fetchData();
                  }}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground active:scale-[0.97]"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </button>
              </div>
            </div>
            {cities.map((city: any) => (
              <div key={city.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
                <div>
                  <p className="text-sm font-bold">{city.name} - {city.state}</p>
                  <p className="text-xs text-muted-foreground">
                    {establishments.filter((e: any) => e.city_id === city.id).length} estabelecimentos •{" "}
                    {motoboys.filter((m: any) => m.city_id === city.id).length} motoboys
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await supabase.from("cities").update({ is_active: !city.is_active }).eq("id", city.id);
                      toast({ title: city.is_active ? "Cidade desativada" : "Cidade ativada" });
                      fetchData();
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      city.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {city.is_active ? "Ativa" : "Inativa"}
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.from("cities").delete().eq("id", city.id);
                      toast({ title: "Cidade removida" });
                      fetchData();
                    }}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {cities.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <MapPin className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma cidade cadastrada.</p>
              </div>
            )}
          </div>
        )}

        {tab === "establishments" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase text-muted-foreground">Solicitações de parceiros</h3>
            {estApplications.filter((a: any) => a.status === "pending").length === 0 && (
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-xs text-muted-foreground">Nenhuma solicitação pendente.</p>
              </div>
            )}
            {estApplications.filter((a: any) => a.status === "pending").map((app: any) => {
              const d = new Date(app.created_at);
              return (
                <div key={app.id} className="rounded-xl border bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold">{app.name}</p>
                      <p className="text-xs text-muted-foreground">{app.category} • {app.city}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Pendente</span>
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p><span className="text-muted-foreground">Responsável:</span> {app.owner_name}</p>
                    <p><span className="text-muted-foreground">Telefone:</span> {app.phone}</p>
                    <p><span className="text-muted-foreground">Endereço:</span> {app.address}</p>
                    {app.description && <p><span className="text-muted-foreground">Descrição:</span> {app.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        // Find or create city
                        let cityMatch = cities.find((c: any) => c.name.toLowerCase() === app.city.toLowerCase());
                        if (!cityMatch) {
                          const { data: newCity, error: cityErr } = await supabase.from("cities").insert({ name: app.city.trim(), state: "MG" }).select().single();
                          if (cityErr || !newCity) {
                            toast({ title: "Erro ao criar cidade automaticamente.", variant: "destructive" });
                            return;
                          }
                          cityMatch = newCity;
                          toast({ title: `📍 Cidade "${newCity.name}" criada automaticamente` });
                        }

                        // Generate unique access code (6 chars alphanumeric)
                        const generateCode = () => {
                          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                          let code = "";
                          for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
                          return code;
                        };
                        let accessCode = generateCode();
                        // Check uniqueness
                        const { data: existingCodes } = await supabase.from("establishments").select("access_code");
                        const usedCodes = new Set((existingCodes || []).map((e: any) => e.access_code));
                        while (usedCodes.has(accessCode)) accessCode = generateCode();

                        const { error: insertErr } = await supabase.from("establishments").insert({
                          name: app.name,
                          phone: app.phone,
                          address: app.address,
                          city_id: cityMatch.id,
                          category: app.category,
                          access_code: accessCode,
                          status: "active",
                        });
                        if (insertErr) {
                          toast({ title: "Erro ao criar estabelecimento: " + insertErr.message, variant: "destructive" });
                          return;
                        }
                        const { error: updateErr } = await supabase.from("establishment_applications").update({ status: "approved" } as any).eq("id", app.id);
                        if (updateErr) {
                          toast({ title: "Erro ao atualizar solicitação: " + updateErr.message, variant: "destructive" });
                        }
                        toast({ title: `✅ Estabelecimento aprovado com sucesso! Código: ${accessCode}` });

                        // Send WhatsApp notification
                        openWhatsApp(app.phone, `Olá! Seu cadastro no ChamaMotoboy foi aprovado! 🎉\n\nSeu código de acesso é: *${accessCode}*\n\nUse esse código para acessar o painel do seu estabelecimento.`);

                        fetchData();
                      }}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground active:scale-[0.97]"
                    >
                      <CheckCircle className="h-3 w-3" /> Aprovar
                    </button>
                    <button
                      onClick={async () => {
                        const { error } = await supabase.from("establishment_applications").update({ status: "rejected" } as any).eq("id", app.id);
                        if (error) {
                          toast({ title: "Erro ao recusar: " + error.message, variant: "destructive" });
                          return;
                        }
                        toast({ title: `❌ Estabelecimento recusado com sucesso` });
                        fetchData();
                      }}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-destructive py-2 text-xs font-bold text-destructive-foreground active:scale-[0.97]"
                    >
                      <X className="h-3 w-3" /> Recusar
                    </button>
                  </div>
                </div>
              );
            })}

            <h3 className="text-sm font-bold uppercase text-muted-foreground pt-2">Estabelecimentos ativos</h3>
            {establishments.filter((e: any) => e.status === "active").map((est: any) => {
              const city = cities.find((c: any) => c.id === est.city_id);
              return (
                <div key={est.id} className="rounded-xl border bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold">{est.name}</p>
                      <p className="text-xs text-muted-foreground">{est.category} • {city?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">📞 {est.phone}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      est.is_open ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {est.is_open ? "Aberto" : "Fechado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                    <span className="text-xs font-medium">🔑 Código: <span className="font-bold">{est.access_code}</span></span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(est.access_code || "");
                        toast({ title: "📋 Código copiado!" });
                      }}
                      className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Copy className="h-3 w-3" /> Copiar
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRemovingEstId(est.id)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-destructive py-2 text-xs font-bold text-destructive-foreground active:scale-[0.97]"
                    >
                      <Trash2 className="h-3 w-3" /> Remover
                    </button>
                  </div>
                </div>
              );
            })}
            {establishments.filter((e: any) => e.status === "active").length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <Store className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum estabelecimento ativo.</p>
              </div>
            )}
          </div>
        )}

        {tab === "farmacias" && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <span className="text-5xl">💊</span>
            <p className="text-sm text-muted-foreground text-center">Gerencie farmácias, produtos e categorias</p>
            <button
              onClick={() => navigate("/admin/farmacias")}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground active:scale-[0.97] shadow-lg"
            >
              <Pill className="h-4 w-4" /> Abrir Gestão de Farmácias
            </button>
          </div>
        )}

        {tab === "categorias" && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <span className="text-5xl">🗂️</span>
            <p className="text-sm text-muted-foreground text-center">Gerencie categorias e estabelecimentos do app</p>
            <button
              onClick={() => navigate("/admin/categorias")}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground active:scale-[0.97] shadow-lg"
            >
              <LayoutGrid className="h-4 w-4" /> Abrir Gestão de Categorias
            </button>
          </div>
        )}

        {tab === "financeiro" && (() => {
          const completed = orders.filter((o) => o.status === "completed");
          const partner = completed.filter((o) => o.order_type === "partner");

          // Daily breakdown
          const dailyMap: Record<string, { date: string; label: string; motoboy: number; est: number; total: number }> = {};
          completed.forEach((o) => {
            const d = new Date(o.completed_at || o.created_at);
            const key = d.toISOString().slice(0, 10);
            if (!dailyMap[key]) dailyMap[key] = { date: key, label: d.toLocaleDateString("pt-BR"), motoboy: 0, est: 0, total: 0 };
            dailyMap[key].motoboy += 2;
            dailyMap[key].total += 2;
          });
          partner.forEach((o) => {
            const d = new Date(o.completed_at || o.created_at);
            const key = d.toISOString().slice(0, 10);
            if (dailyMap[key]) {
              dailyMap[key].est += 2;
              dailyMap[key].total += 2;
            }
          });
          const daily = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));

          // By city
          const cityMap: Record<string, { name: string; motoboy: number; est: number; total: number }> = {};
          completed.forEach((o) => {
            const city = cities.find((c: any) => c.id === o.city_id);
            const name = city?.name || "Sem cidade";
            if (!cityMap[name]) cityMap[name] = { name, motoboy: 0, est: 0, total: 0 };
            cityMap[name].motoboy += 2;
            cityMap[name].total += 2;
          });
          partner.forEach((o) => {
            const city = cities.find((c: any) => c.id === o.city_id);
            const name = city?.name || "Sem cidade";
            if (cityMap[name]) {
              cityMap[name].est += 2;
              cityMap[name].total += 2;
            }
          });
          const byCity = Object.values(cityMap).sort((a, b) => b.total - a.total);

          // By establishment
          const estMap: Record<string, { name: string; orders: number; commission: number }> = {};
          partner.forEach((o) => {
            const est = establishments.find((e: any) => e.id === o.establishment_id);
            const name = est?.name || "Desconhecido";
            if (!estMap[name]) estMap[name] = { name, orders: 0, commission: 0 };
            estMap[name].orders++;
            estMap[name].commission += 2;
          });
          const byEst = Object.values(estMap).sort((a, b) => b.commission - a.commission);

          return (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border bg-card p-3 text-center">
                  <p className="text-lg font-bold text-primary">R${motoboyRevenue + estRevenue}</p>
                  <p className="text-[10px] text-muted-foreground">Receita Total</p>
                </div>
                <div className="rounded-xl border bg-card p-3 text-center">
                  <p className="text-lg font-bold">R${motoboyRevenue}</p>
                  <p className="text-[10px] text-muted-foreground">Motoboys</p>
                </div>
                <div className="rounded-xl border bg-card p-3 text-center">
                  <p className="text-lg font-bold">R${estRevenue}</p>
                  <p className="text-[10px] text-muted-foreground">Parceiros</p>
                </div>
              </div>

              {/* Daily breakdown */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold">Receita por dia</h3>
                </div>
                {daily.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhuma corrida finalizada ainda.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {daily.map((d) => (
                      <div key={d.date} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                        <span className="text-muted-foreground text-xs">{d.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground">🏍️ R${d.motoboy}</span>
                          {d.est > 0 && <span className="text-[10px] text-muted-foreground">🏪 R${d.est}</span>}
                          <span className="font-bold text-xs text-primary">R${d.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* By city */}
              {byCity.length > 0 && (
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold">Receita por cidade</h3>
                  </div>
                  <div className="space-y-2">
                    {byCity.map((c) => (
                      <div key={c.name} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                        <span className="text-xs font-medium">{c.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground">🏍️ R${c.motoboy}</span>
                          {c.est > 0 && <span className="text-[10px] text-muted-foreground">🏪 R${c.est}</span>}
                          <span className="font-bold text-xs text-primary">R${c.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By establishment */}
              {byEst.length > 0 && (
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold">Comissão por estabelecimento</h3>
                  </div>
                  <div className="space-y-2">
                    {byEst.map((e) => (
                      <div key={e.name} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                        <div>
                          <p className="text-xs font-medium">{e.name}</p>
                          <p className="text-[10px] text-muted-foreground">{e.orders} pedidos</p>
                        </div>
                        <span className="font-bold text-xs text-primary">R${e.commission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Motoboy breakdown */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold">Comissão por motoboy</h3>
                </div>
                <div className="space-y-2">
                  {motoboys.filter((m) => {
                    const stats = getMotoboyStats(m.id);
                    return stats.totalRides > 0;
                  }).map((m) => {
                    const stats = getMotoboyStats(m.id);
                    return (
                      <div key={m.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                        <div>
                          <p className="text-xs font-medium">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground">{stats.totalRides} corridas • Deve: R${stats.owed}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xs text-primary">R${stats.totalCommission}</span>
                          {stats.owed > 0 && (
                            <button
                              onClick={() => markAsPaid(m.id)}
                              className="block mt-1 text-[10px] font-bold text-primary underline"
                            >
                              Marcar pago
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        <div className="pt-4 border-t">
          <button
            onClick={() => setShowCleanupConfirm(true)}
            className="w-full rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground active:scale-[0.97]"
          >
            🗑️ Limpar histórico de corridas
          </button>
        </div>
      </main>

      {showCleanupConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-center">⚠️ Limpar histórico?</h3>
            <p className="text-sm text-muted-foreground text-center">
              Tem certeza que deseja apagar todo o histórico de corridas finalizadas? Essa ação não pode ser desfeita.
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Corridas em andamento ou pendentes serão mantidas.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCleanupConfirm(false)} className="flex-1 rounded-xl border py-3 text-sm font-bold text-muted-foreground active:scale-[0.97]">Cancelar</button>
              <button onClick={cleanupHistory} disabled={cleaning} className="flex-1 rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground active:scale-[0.97] disabled:opacity-50">
                {cleaning ? "Apagando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {removingEstId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-center">⚠️ Remover estabelecimento?</h3>
            <p className="text-sm text-muted-foreground text-center">
              Tem certeza que deseja remover este estabelecimento? Ele não receberá mais pedidos e não aparecerá para clientes.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRemovingEstId(null)} className="flex-1 rounded-xl border py-3 text-sm font-bold text-muted-foreground active:scale-[0.97]">Cancelar</button>
              <button
                onClick={async () => {
                  const { error } = await supabase.from("establishments").update({ status: "inactive" }).eq("id", removingEstId);
                  if (error) {
                    toast({ title: "Erro ao remover: " + error.message, variant: "destructive" });
                    return;
                  }
                  toast({ title: "✅ Estabelecimento removido com sucesso" });
                  setRemovingEstId(null);
                  fetchData();
                }}
                className="flex-1 rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground active:scale-[0.97]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" onClick={() => setViewingPhoto(null)}>
          <img src={viewingPhoto} alt="Foto" className="max-h-[80vh] max-w-full rounded-xl shadow-xl" />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
