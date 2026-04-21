import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut, Loader2, LayoutDashboard, Store, Bike, Package, DollarSign,
  Plus, Copy, CheckCircle, X, Power, MapPin, Phone, TrendingUp, Calendar,
  Trash2, Snowflake, Sun,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";

type Tab = "dashboard" | "establishments" | "motoboys" | "orders" | "financeiro";

const ESTAB_COMMISSION = 2;
const MOTOBOY_COMMISSION = 1;

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") !== "true") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [motoboys, setMotoboys] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Modais
  const [showAddEst, setShowAddEst] = useState(false);
  const [showAddMoto, setShowAddMoto] = useState(false);

  const fetchData = async () => {
    const [m, e, o, c, p] = await Promise.all([
      supabase.from("motoboys").select("*").order("name"),
      supabase.from("establishments").select("*").order("name"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("cities").select("*").eq("is_active", true).order("name"),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
    ]);
    setMotoboys(m.data || []);
    setEstablishments(e.data || []);
    setOrders(o.data || []);
    setCities(c.data || []);
    setPayments(p.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  useRefetchOnFocus(() => fetchData());

  // Realtime
  useEffect(() => {
    const ch = supabase.channel("admin-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "motoboys" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "establishments" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    navigate("/login", { replace: true });
  };

  // ============ STATS ============
  const today = new Date(); today.setHours(0,0,0,0);
  const ordersToday = orders.filter(o => new Date(o.created_at) >= today);
  const ordersInProgress = orders.filter(o => ["accepted","picked_up","in_transit"].includes(o.status));
  const finishedToday = ordersToday.filter(o => o.status === "completed");
  const activeEsts = establishments.filter(e => e.status === "active").length;
  const onlineMotos = motoboys.filter(m => m.status === "available" || m.status === "busy").length;
  const revenueToday = finishedToday.length * (ESTAB_COMMISSION + MOTOBOY_COMMISSION);

  // ============ CARD ============
  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="rounded-2xl bg-card p-4 shadow-sm border border-border">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-xl font-bold text-foreground truncate">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      {/* HEADER */}
      <header className="sticky top-0 z-20 bg-primary text-primary-foreground shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold">Painel Admin</h1>
            <p className="text-xs opacity-80">ChamaMoto</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium active:scale-95">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <main className="px-4 py-4 max-w-3xl mx-auto space-y-4">
        {tab === "dashboard" && (
          <DashboardSection
            ordersToday={ordersToday.length}
            inProgress={ordersInProgress.length}
            activeEsts={activeEsts}
            onlineMotos={onlineMotos}
            revenueToday={revenueToday}
            StatCard={StatCard}
          />
        )}

        {tab === "establishments" && (
          <EstablishmentsSection
            establishments={establishments}
            orders={orders}
            onAdd={() => setShowAddEst(true)}
            onRefresh={fetchData}
          />
        )}

        {tab === "motoboys" && (
          <MotoboysSection
            motoboys={motoboys}
            orders={orders}
            payments={payments}
            onAdd={() => setShowAddMoto(true)}
            onRefresh={fetchData}
          />
        )}

        {tab === "orders" && (
          <OrdersSection
            orders={orders}
            establishments={establishments}
            motoboys={motoboys}
          />
        )}

        {tab === "financeiro" && (
          <FinanceSection
            orders={orders}
            establishments={establishments}
            motoboys={motoboys}
            payments={payments}
            onRefresh={fetchData}
          />
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border shadow-lg">
        <div className="grid grid-cols-5 max-w-3xl mx-auto">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Início" },
            { id: "establishments", icon: Store, label: "Estab." },
            { id: "motoboys", icon: Bike, label: "Motoboys" },
            { id: "orders", icon: Package, label: "Corridas" },
            { id: "financeiro", icon: DollarSign, label: "Financeiro" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                tab === t.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <t.icon className="h-5 w-5" />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* MODAIS */}
      {showAddEst && (
        <AddEstablishmentModal
          cities={cities}
          onClose={() => setShowAddEst(false)}
          onSuccess={() => { setShowAddEst(false); fetchData(); }}
        />
      )}
      {showAddMoto && (
        <AddMotoboyModal
          cities={cities}
          onClose={() => setShowAddMoto(false)}
          onSuccess={() => { setShowAddMoto(false); fetchData(); }}
        />
      )}
    </div>
  );
};

// ==================== DASHBOARD ====================
const DashboardSection = ({ ordersToday, inProgress, activeEsts, onlineMotos, revenueToday, StatCard }: any) => (
  <div className="space-y-3 animate-fade-in">
    <h2 className="text-lg font-bold text-foreground">Resumo de hoje</h2>
    <div className="grid grid-cols-2 gap-3">
      <StatCard icon={Package} label="Corridas hoje" value={ordersToday} color="bg-blue-500" />
      <StatCard icon={TrendingUp} label="Em andamento" value={inProgress} color="bg-orange-500" />
      <StatCard icon={Store} label="Estab. ativos" value={activeEsts} color="bg-purple-500" />
      <StatCard icon={Bike} label="Motoboys online" value={onlineMotos} color="bg-emerald-500" />
    </div>
    <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="h-5 w-5" />
        <span className="text-sm font-medium opacity-90">Faturamento de hoje</span>
      </div>
      <p className="text-3xl font-bold">R$ {revenueToday.toFixed(2)}</p>
      <p className="text-xs opacity-80 mt-1">R$2 estabelecimento + R$1 motoboy por corrida finalizada</p>
    </div>
  </div>
);

// ==================== ESTABELECIMENTOS ====================
const EstablishmentsSection = ({ establishments, orders, onAdd, onRefresh }: any) => {
  const stats = (estId: string) => {
    const list = orders.filter((o: any) => o.establishment_id === estId && o.status === "completed");
    return { count: list.length, total: list.length * ESTAB_COMMISSION };
  };

  const toggleStatus = async (e: any) => {
    const newStatus = e.status === "active" ? "inactive" : "active";
    await supabase.from("establishments").update({ status: newStatus }).eq("id", e.id);
    toast({ title: newStatus === "active" ? "Ativado" : "Desativado" });
    onRefresh();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado!" });
  };

  const handleDelete = async (e: any) => {
    const ok = window.confirm(`Tem certeza que deseja excluir o estabelecimento "${e.name}"?\n\nEsta ação não pode ser desfeita.`);
    if (!ok) return;
    const { error } = await supabase.from("establishments").delete().eq("id", e.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Estabelecimento excluído com sucesso" });
    onRefresh();
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Estabelecimentos ({establishments.length})</h2>
        <button onClick={onAdd} className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground active:scale-95">
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>
      {establishments.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum estabelecimento cadastrado</p>}
      {establishments.map((e: any) => {
        const s = stats(e.id);
        return (
          <div key={e.id} className="rounded-2xl bg-card p-4 shadow-sm border border-border space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">{e.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{e.phone}</p>
                <p className="text-xs text-muted-foreground flex items-start gap-1 mt-0.5"><MapPin className="h-3 w-3 mt-0.5 shrink-0" /><span className="break-words">{e.address}</span></p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${e.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                {e.status === "active" ? "Ativo" : "Inativo"}
              </span>
            </div>
            {e.access_code && (
              <button onClick={() => copyCode(e.access_code)} className="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs font-mono text-foreground hover:bg-muted/70 w-fit">
                🔑 {e.access_code} <Copy className="h-3 w-3" />
              </button>
            )}
            <div className="flex gap-3 text-xs pt-1 border-t border-border">
              <span><b>{s.count}</b> corridas</span>
              <span className="text-emerald-600 font-semibold">R$ {s.total.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => toggleStatus(e)} className="flex items-center justify-center gap-1.5 rounded-lg bg-muted py-2 text-xs font-semibold hover:bg-muted/70 transition-colors">
                <Power className="h-3.5 w-3.5" /> {e.status === "active" ? "Desativar" : "Ativar"}
              </button>
              <button onClick={() => handleDelete(e)} className="flex items-center justify-center gap-1.5 rounded-lg bg-red-500 text-white py-2 text-xs font-semibold hover:bg-red-600 transition-colors active:scale-95">
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==================== MOTOBOYS ====================
const MotoboysSection = ({ motoboys, orders, payments, onAdd, onRefresh }: any) => {
  const stats = (motoId: string) => {
    const finished = orders.filter((o: any) => o.motoboy_id === motoId && o.status === "completed");
    const paidIds = new Set(payments.filter((p: any) => p.motoboy_id === motoId).map((p: any) => p.id));
    const total = finished.length * MOTOBOY_COMMISSION;
    const paid = payments.filter((p: any) => p.motoboy_id === motoId).reduce((s: number, p: any) => s + Number(p.amount), 0);
    return { count: finished.length, total, due: total - paid };
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado!" });
  };

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Motoboys ({motoboys.length})</h2>
        <button onClick={onAdd} className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground active:scale-95">
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>
      {motoboys.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum motoboy cadastrado</p>}
      {motoboys.map((m: any) => {
        const s = stats(m.id);
        const online = m.status === "available" || m.status === "busy";
        return (
          <div key={m.id} className="rounded-2xl bg-card p-4 shadow-sm border border-border space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">{m.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{m.phone}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${online ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                {online ? "🟢 Online" : "Offline"}
              </span>
            </div>
            {m.access_code && (
              <button onClick={() => copyCode(m.access_code)} className="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs font-mono text-foreground hover:bg-muted/70 w-fit">
                🔑 {m.access_code} <Copy className="h-3 w-3" />
              </button>
            )}
            <div className="flex gap-3 text-xs pt-1 border-t border-border flex-wrap">
              <span><b>{s.count}</b> corridas</span>
              <span className="text-emerald-600 font-semibold">Total: R$ {s.total.toFixed(2)}</span>
              {s.due > 0 && <span className="text-orange-600 font-semibold">Devido: R$ {s.due.toFixed(2)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==================== CORRIDAS ====================
const OrdersSection = ({ orders, establishments, motoboys }: any) => {
  const estName = (id: string) => establishments.find((e: any) => e.id === id)?.name || "—";
  const motoName = (id: string) => motoboys.find((m: any) => m.id === id)?.name || "Aguardando…";

  const statusColor = (s: string) => ({
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-blue-100 text-blue-700",
    picked_up: "bg-indigo-100 text-indigo-700",
    in_transit: "bg-purple-100 text-purple-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  }[s] || "bg-muted text-muted-foreground");

  const statusLabel = (s: string) => ({
    pending: "Pendente", accepted: "Aceita", picked_up: "Coletado",
    in_transit: "A caminho", completed: "Finalizada", cancelled: "Cancelada",
  }[s] || s);

  return (
    <div className="space-y-3 animate-fade-in">
      <h2 className="text-lg font-bold">Corridas ({orders.length})</h2>
      {orders.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma corrida registrada</p>}
      {orders.map((o: any) => (
        <div key={o.id} className="rounded-2xl bg-card p-4 shadow-sm border border-border space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</p>
              <p className="font-semibold text-foreground truncate">🏪 {estName(o.establishment_id)}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(o.status)}`}>{statusLabel(o.status)}</span>
          </div>
          <p className="text-sm text-foreground"><b>Cliente:</b> {o.customer_name} — {o.customer_phone}</p>
          <p className="text-sm text-muted-foreground break-words"><b>Endereço:</b> {o.delivery_address}</p>
          <p className="text-sm text-muted-foreground"><b>Motoboy:</b> {motoName(o.motoboy_id)}</p>
          {o.item_description && <p className="text-xs text-muted-foreground break-words bg-muted/50 rounded p-1.5">📦 {o.item_description}</p>}
        </div>
      ))}
    </div>
  );
};

// ==================== FINANCEIRO ====================
const FinanceSection = ({ orders, establishments, motoboys, payments, onRefresh }: any) => {
  const finished = orders.filter((o: any) => o.status === "completed");
  const totalEst = finished.length * ESTAB_COMMISSION;
  const totalMoto = finished.length * MOTOBOY_COMMISSION;
  const totalGeneral = totalEst + totalMoto;

  const estStats = useMemo(() => establishments.map((e: any) => {
    const c = finished.filter((o: any) => o.establishment_id === e.id).length;
    return { ...e, count: c, total: c * ESTAB_COMMISSION };
  }).sort((a: any, b: any) => b.total - a.total), [establishments, finished]);

  const motoStats = useMemo(() => motoboys.map((m: any) => {
    const c = finished.filter((o: any) => o.motoboy_id === m.id).length;
    const total = c * MOTOBOY_COMMISSION;
    const paid = payments.filter((p: any) => p.motoboy_id === m.id).reduce((s: number, p: any) => s + Number(p.amount), 0);
    return { ...m, count: c, total, due: total - paid };
  }).sort((a: any, b: any) => b.due - a.due), [motoboys, finished, payments]);

  const markPaid = async (moto: any) => {
    if (moto.due <= 0) { toast({ title: "Nada a pagar" }); return; }
    const { error } = await supabase.from("payments").insert({
      motoboy_id: moto.id,
      amount: moto.due,
      admin_note: `Quitação de R$ ${moto.due.toFixed(2)}`,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Pagamento registrado!" });
    onRefresh();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg">
        <p className="text-sm opacity-90">Faturamento geral</p>
        <p className="text-3xl font-bold">R$ {totalGeneral.toFixed(2)}</p>
        <div className="flex gap-4 mt-2 text-xs opacity-90">
          <span>Estab: R$ {totalEst.toFixed(2)}</span>
          <span>Motoboys: R$ {totalMoto.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-2 text-foreground">Por estabelecimento</h3>
        <div className="space-y-2">
          {estStats.length === 0 && <p className="text-sm text-muted-foreground">Nenhum dado</p>}
          {estStats.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between gap-2 rounded-xl bg-card p-3 shadow-sm border border-border">
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{e.name}</p>
                <p className="text-xs text-muted-foreground">{e.count} corridas</p>
              </div>
              <span className="font-bold text-emerald-600 shrink-0">R$ {e.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-2 text-foreground">Por motoboy</h3>
        <div className="space-y-2">
          {motoStats.length === 0 && <p className="text-sm text-muted-foreground">Nenhum dado</p>}
          {motoStats.map((m: any) => (
            <div key={m.id} className="rounded-xl bg-card p-3 shadow-sm border border-border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.count} corridas — total R$ {m.total.toFixed(2)}</p>
                </div>
                <span className={`font-bold shrink-0 ${m.due > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                  R$ {m.due.toFixed(2)}
                </span>
              </div>
              {m.due > 0 && (
                <button onClick={() => markPaid(m)} className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white active:scale-95">
                  ✓ MARCAR COMO PAGO
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== MODAL: ADD ESTABELECIMENTO ====================
const AddEstablishmentModal = ({ cities, onClose, onSuccess }: any) => {
  const [form, setForm] = useState({ name: "", phone: "", address: "", access_code: "", city_id: cities[0]?.id || "" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name || !form.phone || !form.address || !form.access_code || !form.city_id) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("establishments").insert({
      name: form.name.trim(),
      phone: form.phone.replace(/\D/g, "").slice(-11),
      address: form.address.trim(),
      access_code: form.access_code.trim().toUpperCase(),
      city_id: form.city_id,
      category: "Geral",
      status: "active",
      is_open: true,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Estabelecimento cadastrado!" });
    onSuccess();
  };

  return (
    <Modal title="Novo estabelecimento" onClose={onClose}>
      <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <Field label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(35) 99999-9999" />
      <Field label="Endereço de retirada" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
      <Field label="Código de acesso" value={form.access_code} onChange={(v) => setForm({ ...form, access_code: v.toUpperCase() })} placeholder="EX: MAXSUL" />
      <div className="space-y-1">
        <label className="text-sm font-semibold">Cidade</label>
        <select value={form.city_id} onChange={(e) => setForm({ ...form, city_id: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
          {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name} - {c.state}</option>)}
        </select>
      </div>
      <button onClick={submit} disabled={saving} className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground active:scale-95 disabled:opacity-50">
        {saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "CADASTRAR"}
      </button>
    </Modal>
  );
};

// ==================== MODAL: ADD MOTOBOY ====================
const AddMotoboyModal = ({ cities, onClose, onSuccess }: any) => {
  const [form, setForm] = useState({ name: "", phone: "", vehicle: "Moto", access_code: "", city_id: cities[0]?.id || "", region: "" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name || !form.phone || !form.access_code || !form.city_id) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    const cityName = cities.find((c: any) => c.id === form.city_id)?.name || "";
    const { error } = await supabase.from("motoboys").insert({
      name: form.name.trim(),
      phone: form.phone.replace(/\D/g, "").slice(-11),
      vehicle: form.vehicle,
      access_code: form.access_code.trim().toUpperCase(),
      city_id: form.city_id,
      region: form.region || cityName,
      status: "offline",
      is_available: false,
    });
    setSaving(false);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Motoboy cadastrado!" });
    onSuccess();
  };

  return (
    <Modal title="Novo motoboy" onClose={onClose}>
      <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <Field label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(35) 99999-9999" />
      <Field label="Veículo" value={form.vehicle} onChange={(v) => setForm({ ...form, vehicle: v })} placeholder="Moto / Bicicleta" />
      <Field label="Código de acesso" value={form.access_code} onChange={(v) => setForm({ ...form, access_code: v.toUpperCase() })} placeholder="EX: EDUARDO123" />
      <div className="space-y-1">
        <label className="text-sm font-semibold">Cidade</label>
        <select value={form.city_id} onChange={(e) => setForm({ ...form, city_id: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
          {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name} - {c.state}</option>)}
        </select>
      </div>
      <button onClick={submit} disabled={saving} className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground active:scale-95 disabled:opacity-50">
        {saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "CADASTRAR"}
      </button>
    </Modal>
  );
};

// ==================== HELPERS ====================
const Modal = ({ title, children, onClose }: any) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 animate-fade-in" onClick={onClose}>
    <div className="bg-card rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-3 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{title}</h3>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
      </div>
      {children}
    </div>
  </div>
);

const Field = ({ label, value, onChange, placeholder }: any) => (
  <div className="space-y-1">
    <label className="text-sm font-semibold">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
    />
  </div>
);

export default AdminDashboard;
