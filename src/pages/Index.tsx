import { useNavigate } from "react-router-dom";
import { ShoppingBag, Bike, Package, ArrowRight, MessageCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import AnimatedCounter from "@/components/AnimatedCounter";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import logoImg from "@/assets/logo-chamamoto.png";

const WHATSAPP_NUMBER = "5535997570009";

const steps = [
  { icon: ShoppingBag, title: "1. Peça", desc: "Diga o que você quer e onde entregar." },
  { icon: Bike, title: "2. A gente busca", desc: "Um motoboy vai até o local e compra pra você." },
  { icon: Package, title: "3. Receba", desc: "Entrega rápida na porta da sua casa." },
];

const Index = () => {
  const navigate = useNavigate();
  const howItWorks = useScrollAnimation();
  const counters = useScrollAnimation();
  const testimonials = useScrollAnimation();
  const ctaFinal = useScrollAnimation();

  const handleWhatsApp = () => {
    const msg = encodeURIComponent("Olá! Gostaria de fazer um pedido. Podem me ajudar?");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* ===== HERO ===== */}
      <header className="relative overflow-hidden bg-primary px-6 pb-20 pt-10 text-primary-foreground">
        {/* Decorative circles */}
        <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-primary-foreground/10" />
        <div className="absolute -top-8 right-10 h-24 w-24 rounded-full bg-primary-foreground/5" />
        <div className="absolute bottom-8 left-4 h-16 w-16 rounded-full bg-primary-foreground/5" />

        <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up">
          {/* Logo */}
          <img
            src={logoImg}
            alt="ChamaMoto"
            className="h-16 w-auto mb-6 drop-shadow-lg"
          />

          <h1 className="text-[1.75rem] font-extrabold leading-[1.15] max-w-[320px] mb-3">
            Peça qualquer coisa. A gente entrega.
          </h1>
          <p className="text-sm opacity-90 max-w-[280px] mb-8">
            Rápido, fácil e sem complicação.
          </p>

          <div className="flex w-full flex-col gap-3 max-w-[320px]">
            <button
              onClick={() => navigate("/solicitar")}
              className="flex items-center justify-center gap-2 rounded-xl bg-card px-6 py-4 text-lg font-extrabold text-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              CHAMAR MOTOBOY
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 rounded-xl border border-primary-foreground/30 px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              Pedir pelo WhatsApp
            </button>
          </div>
        </div>
      </header>

      {/* ===== COMO FUNCIONA ===== */}
      <section
        ref={howItWorks.ref}
        className={`px-5 py-10 transition-all duration-700 ${
          howItWorks.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="text-center text-xl font-extrabold mb-6">Como funciona?</h2>
        <div className="grid gap-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all duration-500"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-base">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CONTADORES ===== */}
      <section
        ref={counters.ref}
        className={`px-5 py-8 transition-all duration-700 ${
          counters.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="grid grid-cols-3 gap-4 rounded-2xl border bg-card p-6 shadow-sm">
          <AnimatedCounter target={500} suffix="+" label="Entregas" />
          <AnimatedCounter target={50} suffix="+" label="Clientes" />
          <AnimatedCounter target={4.9} label="Avaliação" decimals={1} />
        </div>
      </section>

      {/* ===== DEPOIMENTOS ===== */}
      <section
        ref={testimonials.ref}
        className={`px-5 py-8 transition-all duration-700 ${
          testimonials.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="text-center text-xl font-extrabold mb-6">O que nossos clientes dizem</h2>
        <TestimonialCarousel />
      </section>

      {/* ===== CTA FINAL ===== */}
      <section
        ref={ctaFinal.ref}
        className={`mx-5 mb-6 rounded-2xl bg-primary px-6 py-10 text-primary-foreground text-center transition-all duration-700 ${
          ctaFinal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="text-2xl font-extrabold mb-2">Precisa de algo?</h2>
        <p className="text-sm opacity-90 mb-6">A gente busca pra você em minutos.</p>
        <button
          onClick={() => navigate("/solicitar")}
          className="w-full rounded-xl bg-card px-6 py-4 text-lg font-extrabold text-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          CHAMAR MOTOBOY AGORA
        </button>
      </section>

      <BottomNav />
      <WhatsAppFAB />
    </div>
  );
};

export default Index;
