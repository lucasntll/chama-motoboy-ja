import { useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  estId: string;
  onClose: () => void;
}

type Filter = "today" | "yesterday" | "7d" | "30d";

const STATUS_PT: Record<string, string> = {
  pending: "Aguardando",
  queued: "Em fila",
  accepted: "Aceita",
  picking_up: "Indo retirar",
  delivering: "Em entrega",
  completed: "Finalizada",
  cancelled: "Cancelada",
};

const HistoryModal = ({ estId, onClose }: Props) => {
  const [filter, setFilter] = useState<Filter>("today");
  const [orders, setOrders] = useState<any[]>([]);
  const [motoboys, setMotoboys] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    if (filter === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (filter === "yesterday") {
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (filter === "7d") {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else {
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }
    return { start: start.toISOString(), end: end.toISOString() };
  }, [filter]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("establishment_id", estId)
        .gte("created_at", range.start)
        .lte("created_at", range.end)
        .order("created_at", { ascending: false })
        .limit(200);
      const list = data || [];
      setOrders(list);
      const ids = Array.from(new Set(list.map((o: any) => o.motoboy_id).filter(Boolean))) as string[];
      if (ids.length > 0) {
        const { data: m } = await supabase.from("motoboys").select("id, name").in("id", ids);
        const map: Record<string, any> = {};
        (m || []).forEach((x) => { map[x.id] = x; });
        setMotoboys(map);
      } else {
        setMotoboys({});
      }
      setLoading(false);
    };
    load();
  }, [estId, range.start, range.end]);

  const totalFee = orders
    .filter((o) => o.status === "completed")
    .reduce((acc, o) => acc + Number(o.establishment_commission || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold">📊 Histórico</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-secondary p-1">
            {([
              ["today", "Hoje"],
              ["yesterday", "Ontem"],
              ["7d", "7 dias"],
              ["30d", "30 dias"],
            ] as [Filter, string][]).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-lg py-2 text-xs font-bold transition-all ${filter === k ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 text-center">
            <p className="text-xs text-muted-foreground font-bold uppercase">Taxa acumulada no período</p>
            <p className="text-2xl font-extrabold text-primary">R$ {totalFee.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{orders.length} corrida(s)</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : orders.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Sem corridas no período.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl border bg-card p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold truncate">{o.customer_name}</p>
                    <span className="text-[10px] font-bold uppercase shrink-0">{STATUS_PT[o.status] || o.status}</span>
                  </div>
                  <p className="text-muted-foreground truncate">📍 {o.delivery_address}</p>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>
                      {new Date(o.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span>{o.motoboy_id ? `🛵 ${motoboys[o.motoboy_id]?.name || "—"}` : "—"}</span>
                  </div>
                  {o.status === "completed" && (
                    <p className="text-right font-bold text-primary">R$ {Number(o.establishment_commission || 0).toFixed(2)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;