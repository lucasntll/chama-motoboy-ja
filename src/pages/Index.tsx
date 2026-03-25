import { useNavigate } from "react-router-dom";
import { ShoppingBag, ArrowRight, Bike, Clock } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="relative overflow-hidden bg-primary px-6 pb-10 pt-12 text-primary-foreground">
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-8 w-8" />
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ lineHeight: "1.1" }}>
              ChamaMotoboy
            </h1>
          </div>
          <p className="text-sm font-medium opacity-90 max-w-[280px]" style={{ textWrap: "balance" as any }}>
            Peça qualquer coisa e a gente traz pra você! Rápido, fácil e sem complicação.
          </p>
        </div>
        <div className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-primary-foreground/10" />
        <div className="absolute -top-4 right-10 h-16 w-16 rounded-full bg-primary-foreground/5" />
      </header>

      <main className="flex-1 px-5 -mt-4">
        <button
          onClick={() => navigate("/solicitar")}
          className="animate-fade-in-up-d1 group flex w-full items-center justify-between rounded-xl bg-card p-5 shadow-lg border transition-shadow hover:shadow-xl active:scale-[0.98]"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div className="text-left">
              <span className="block text-lg font-bold">Pedir Agora</span>
              <span className="text-sm text-muted-foreground">A gente busca e entrega pra você</span>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </button>

        <div className="mt-6 grid grid-cols-2 gap-3 animate-fade-in-up-d2" style={{ animationDelay: "0.2s" }}>
          <button
            onClick={() => navigate("/motoristas")}
            className="flex flex-col items-center gap-2 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md active:scale-[0.97]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Bike className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">Motoboys</span>
            <span className="text-xs text-muted-foreground">Ver disponíveis</span>
          </button>

          <button
            onClick={() => navigate("/historico")}
            className="flex flex-col items-center gap-2 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md active:scale-[0.97]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">Histórico</span>
            <span className="text-xs text-muted-foreground">Seus pedidos</span>
          </button>
        </div>

        <div className="mt-8 rounded-xl border bg-secondary/50 p-4 animate-fade-in-up-d3" style={{ animationDelay: "0.3s" }}>
          <p className="text-xs text-secondary-foreground leading-relaxed">
            <strong>Como funciona:</strong> Diga o que precisa, informe seu endereço e um motoboy vai buscar e entregar pra você. Simples assim!
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
