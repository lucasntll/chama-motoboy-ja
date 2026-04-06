import { useNavigate } from "react-router-dom";
import { Bike, ShoppingBag, Settings } from "lucide-react";
import logo from "@/assets/logo-chamamoto.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary px-6">
      <img src={logo} alt="ChamaMoto" className="h-24 w-24 rounded-2xl shadow-lg mb-6 drop-shadow-lg" />

      <h1 className="text-2xl font-bold text-primary-foreground text-center mb-2">
        Peça qualquer coisa.<br />A gente entrega.
      </h1>
      <p className="text-primary-foreground/80 text-center text-sm mb-10">
        Rápido, fácil e sem complicação.
      </p>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={() => navigate("/cliente")}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary-foreground py-5 text-lg font-bold text-primary shadow-xl transition-all active:scale-[0.97] hover:shadow-2xl"
        >
          <ShoppingBag className="h-6 w-6" />
          Sou Cliente
        </button>

        <button
          onClick={() => navigate("/motoboy-acesso")}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-primary-foreground/30 bg-primary-foreground/10 py-5 text-lg font-bold text-primary-foreground shadow-lg transition-all active:scale-[0.97] hover:bg-primary-foreground/20"
        >
          <Bike className="h-6 w-6" />
          Sou Motoboy
        </button>
      </div>

      <button
        onClick={() => navigate("/login")}
        className="mt-6 flex items-center gap-1.5 text-xs text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors"
      >
        <Settings className="h-3 w-3" />
        Admin
      </button>

      <p className="mt-4 text-xs text-primary-foreground/50">
        ChamaMoto © {new Date().getFullYear()}
      </p>
    </div>
  );
};

export default Index;
