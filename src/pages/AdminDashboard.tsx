import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Loader2, Ban, CheckCircle, DollarSign, Users, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Tab = "motoboys" | "orders" | "payments";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [m, o] = await Promise.all([
      supabase.from("motoboys").select("*").order("name"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
    ]);
    setMotoboys(m.data || []);
    setOrders(o.data || []);
    setLoading(false);
  };

  const getMotoboyStats = (motoboyId: string) => {
    const motoboyOrders = orders.filter((o) => o.motoboy_id === motoboyId && o.status === "completed");
    const totalRides = motoboyOrders.length;
    const totalEarned = totalRides * 5; // R$7 - R$2 commission = R$5 net
    const totalCommission = totalRides * 2;
    const paidOrders = motoboyOrders.filter((o: any) => o.is_paid);
    const totalPaid = paidOrders.length * 2;
    const owed = totalCommission - totalPaid;
    return { totalRides, totalEarned, totalCommission, owed };
  };

  const toggleBlock = async (motoboy: any) => {
    const newAvailable = !motoboy.is_available;
    await supabase
      .from("motoboys")
      .update({
        is_available: newAvailable,
        status: newAvailable ? "available" : "inactive",
      })
      .eq("id", motoboy.id);
    toast({ title: newAvailable ? "Motoboy desbloqueado" : "Motoboy bloqueado" });
    fetchData();
  };

  const markAsPaid = async (motoboyId: string) => {
    const unpaid = orders.filter(
      (o) => o.motoboy_id === motoboyId && o.status === "completed" && !o.is_paid
    );
    for (const order of unpaid) {
      await supabase.from("orders").update({ is_paid: true } as any).eq("id", order.id);
    }
    if (unpaid.length > 0) {
      await supabase.from("payments" as any).insert({
        motoboy_id: motoboyId,
        amount: unpaid.length * 1,
        admin_note: `Pagamento de ${unpaid.length} corridas`,
      });
    }
    toast({ title: `Pagamento registrado! ${unpaid.length} corridas` });
    fetchData();
  };

  const handleSignOut = () => {
    handleLogout();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalCompletedOrders = orders.filter((o) => o.status === "completed").length;
  const totalRevenue = totalCompletedOrders * 1; // R$1 commission per ride

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between bg-card px-4 py-3 border-b">
        <div>
          <h1 className="text-lg font-bold">Painel Admin</h1>
          <p className="text-xs text-muted-foreground">ChamaMotoboy</p>
        </div>
        <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-secondary">
          <LogOut className="h-5 w-5 text-muted-foreground" />
        </button>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-bold">{motoboys.length}</p>
          <p className="text-[10px] text-muted-foreground">Motoboys</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-bold">{totalCompletedOrders}</p>
          <p className="text-[10px] text-muted-foreground">Corridas</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-lg font-bold text-primary">R${totalRevenue}</p>
          <p className="text-[10px] text-muted-foreground">Comissões</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b px-4">
        {([
          { key: "motoboys" as Tab, label: "Motoboys", icon: Users },
          { key: "orders" as Tab, label: "Corridas", icon: Package },
          { key: "payments" as Tab, label: "Pagamentos", icon: DollarSign },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
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
                  <p className="text-xs font-bold text-primary">R${stats.totalEarned}</p>
                  <p className="text-[9px] text-muted-foreground">Ganho</p>
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
              </div>
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

        {tab === "orders" && orders.map((o) => {
          const motoboy = motoboys.find((m) => m.id === o.motoboy_id);
          return (
            <div key={o.id} className="rounded-xl border bg-card p-3 space-y-1">
              <div className="flex items-start justify-between">
                <p className="text-sm font-bold">{o.item_description}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">📍 {o.delivery_address}</p>
              <p className="text-xs text-muted-foreground">👤 {o.customer_name} • {o.customer_phone}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  🏍️ {motoboy?.name || "—"}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  o.status === "completed" ? "bg-green-100 text-green-700" :
                  o.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {o.status}
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
                <span className={`font-bold ${stats.owed > 0 ? "text-destructive" : "text-primary"}`}>
                  R${stats.owed}
                </span>
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
      </main>
    </div>
  );
};

export default AdminDashboard;
