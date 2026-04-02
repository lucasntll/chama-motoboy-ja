import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Package } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface RideRecord {
  id: string;
  motoboyName: string;
  orderDesc: string;
  deliveryAddress: string;
  price: number;
  date: string;
  status: string;
}

const statusLabels: Record<string, string> = {
  pending: "⏳ Procurando motoboy",
  accepted: "🏍️ Motoboy a caminho",
  picking_up: "🛒 Buscando pedido",
  delivering: "📦 Indo entregar",
  completed: "✅ Entregue",
};

const MyOrders = () => {
  const navigate = useNavigate();
  const history: RideRecord[] = JSON.parse(localStorage.getItem("ride_history") || "[]");

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Meus Pedidos</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-3">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Package className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Nenhum pedido ainda</p>
            <button
              onClick={() => navigate("/solicitar")}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground active:scale-[0.97]"
            >
              Fazer primeiro pedido
            </button>
          </div>
        ) : (
          history.map((ride) => (
            <div key={ride.id} className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">{ride.orderDesc}</p>
                  <p className="text-xs text-muted-foreground">{ride.deliveryAddress}</p>
                </div>
                <span className="text-sm font-bold text-primary">R$ {ride.price?.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{statusLabels[ride.status] || ride.status}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(ride.date).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {ride.motoboyName && (
                <p className="text-xs text-muted-foreground">🏍️ {ride.motoboyName}</p>
              )}
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default MyOrders;
