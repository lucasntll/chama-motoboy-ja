import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Phone, Bike } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";
import type { Motoboy } from "@/lib/data";
import BottomNav from "@/components/BottomNav";
import StarRating from "@/components/StarRating";

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const motoboy = (location.state as { motoboy?: Motoboy })?.motoboy;

  if (!motoboy) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pb-20">
        <div className="text-center">
          <p className="text-muted-foreground">Nenhuma solicitação encontrada.</p>
          <button onClick={() => navigate("/")} className="mt-4 text-primary font-semibold text-sm">
            Voltar ao início
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const initials = motoboy.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-5 pb-20 pt-12">
      <div className="animate-fade-in-up flex flex-col items-center text-center">
        <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-xl font-bold mb-1">Solicitação Enviada!</h1>
        <p className="text-sm text-muted-foreground">Seu motoboy está a caminho!</p>
      </div>

      <div className="mt-8 w-full max-w-sm animate-fade-in-up rounded-xl border bg-card p-6 shadow-lg" style={{ animationDelay: "0.15s" }}>
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-lg mb-3">
            {initials}
          </div>
          <h2 className="text-lg font-bold">{motoboy.name}</h2>
          <StarRating rating={Math.round(motoboy.rating)} size={16} />

          <div className="mt-4 w-full space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Bike className="h-4 w-4 text-muted-foreground" />
              <span>{motoboy.vehicle} · {motoboy.plate}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{motoboy.phone}</span>
            </div>
          </div>

          <a
            href={whatsappUrl(motoboy.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow transition-shadow hover:shadow-lg active:scale-[0.97]"
          >
            <Phone className="h-4 w-4" />
            Contatar via WhatsApp
          </a>
        </div>
      </div>

      <button
        onClick={() => navigate("/")}
        className="mt-6 text-sm font-semibold text-primary animate-fade-in-up"
        style={{ animationDelay: "0.3s" }}
      >
        Voltar ao início
      </button>

      <BottomNav />
    </div>
  );
};

export default Confirmation;
