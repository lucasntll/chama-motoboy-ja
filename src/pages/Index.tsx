import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, ShoppingBag, Settings } from "lucide-react";
import logo from "@/assets/logo-chamamoto.png";
import ActiveOrderBanner from "@/components/ActiveOrderBanner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const Index = () => {
  const navigate = useNavigate();
  const pwa = usePWAInstall();

  useEffect(() => {
    pwa.triggerShow("visit");
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary px-6 py-10">
      <img src={logo} alt="ChamaMoto" className="h-24 w-24 rounded-2xl shadow-lg mb-6 drop-shadow-lg" />

      <h1 className="text-2xl font-bold text-primary-foreground text-center mb-2">
        Peça qualquer coisa<br />sem sair de casa 🛵⚡
      </h1>
      <p className="text-primary-foreground/80 text-center text-sm mb-8">
        Entrega rápida na sua cidade 👊
      </p>

      <ActiveOrderBanner />

      <div className="w-full max-w-sm space-y-4 mt-6">
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

      {pwa.canShow && !pwa.isInstalled && (
        <PWAInstallPrompt
          variant="client"
          isIOS={pwa.isIOS}
          hasNativePrompt={pwa.hasNativePrompt}
          onInstall={pwa.installNative}
          onDismiss={pwa.dismiss}
        />
      )}
    </div>
  );
};

export default Index;
