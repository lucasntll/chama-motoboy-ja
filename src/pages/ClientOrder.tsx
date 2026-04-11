import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store, ShoppingBag, Clock } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const ClientOrder = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate("/")} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Como quer pedir?</h1>
      </header>

      <main className="flex-1 px-4 py-6 space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Escolha como quer fazer seu pedido 👇
        </p>

        <button
          onClick={() => navigate("/cliente/parceiro")}
          className="w-full rounded-2xl border-2 border-primary/20 bg-card p-5 text-left transition-all hover:border-primary/50 hover:shadow-lg active:scale-[0.98] space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-foreground">Pedir de um parceiro</h2>
              <p className="text-sm text-muted-foreground">Estabelecimentos cadastrados</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">⚡ Mais rápido — o estabelecimento já prepara!</span>
          </div>
        </button>

        <button
          onClick={() => navigate("/cliente/livre")}
          className="w-full rounded-2xl border-2 border-muted bg-card p-5 text-left transition-all hover:border-primary/30 hover:shadow-lg active:scale-[0.98] space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
              <ShoppingBag className="h-6 w-6 text-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-foreground">Pedido livre</h2>
              <p className="text-sm text-muted-foreground">Compre em qualquer lugar</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">O motoboy compra e entrega pra você</span>
          </div>
        </button>
      </main>

      <BottomNav />
    </div>
  );
};

export default ClientOrder;
