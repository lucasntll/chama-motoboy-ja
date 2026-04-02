import { useNavigate } from "react-router-dom";
import { ShoppingBag, ArrowRight, Clock, MessageCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const WHATSAPP_NUMBER = "5535997570009";

const Index = () => {
  const navigate = useNavigate();

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      "Olá! Gostaria de fazer um pedido. Podem me ajudar?"
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="relative overflow-hidden bg-primary px-6 pb-12 pt-14 text-primary-foreground">
        <div className="animate-fade-in-up relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="h-7 w-7" />
            <span className="text-lg font-extrabold tracking-tight">ChamaMotoboy</span>
          </div>
          <h1 className="text-2xl font-extrabold leading-tight max-w-[280px]">
            Precisa de algo? A gente busca e entrega pra você.
          </h1>
        </div>
        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-primary-foreground/10" />
        <div className="absolute -top-4 right-10 h-16 w-16 rounded-full bg-primary-foreground/5" />
      </header>

      <main className="flex-1 px-5 -mt-5 space-y-4">
        {/* Main CTA */}
        <button
          onClick={() => navigate("/solicitar")}
          className="animate-fade-in-up group flex w-full items-center justify-between rounded-2xl bg-card p-5 shadow-lg border transition-all hover:shadow-xl active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div className="text-left">
              <span className="block text-lg font-bold">CHAMAR MOTOBOY</span>
              <span className="text-sm text-muted-foreground">Peça qualquer coisa!</span>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </button>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <button
            onClick={() => navigate("/meus-pedidos")}
            className="flex flex-col items-center gap-2 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">Meus Pedidos</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex flex-col items-center gap-2 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircle className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">Pedir pelo WhatsApp</span>
          </button>
        </div>

        <div className="rounded-xl border bg-secondary/50 p-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
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
