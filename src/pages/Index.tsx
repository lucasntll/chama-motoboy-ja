import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bike, ShoppingBag, Settings, Pill, ShoppingCart, Beer, Croissant, Beef, Store, FileText, MoreHorizontal } from "lucide-react";
import logo from "@/assets/logo-chamamoto.png";
import ActiveOrderBanner from "@/components/ActiveOrderBanner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import CitySelector from "@/components/CitySelector";
import { useCitySelection } from "@/hooks/useCitySelection";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pwa = usePWAInstall();
  const { cities, selectedCity, loading: citiesLoading, selectCity, clearCity } = useCitySelection();

  // Handle deep links from WhatsApp query params
  useEffect(() => {
    const pedidoId = searchParams.get("pedido");
    const target = searchParams.get("to");

    if (pedidoId) {
      navigate(`/acompanhar/${pedidoId}`, { replace: true });
      return;
    }
    if (target === "motoboy") {
      navigate("/motoboy-acesso", { replace: true });
      return;
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    pwa.triggerShow("visit");
  }, []);

  const hasCity = !!selectedCity;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary px-6 py-10">
      <img src={logo} alt="ChamaMoto" className="h-28 w-auto mb-6 drop-shadow-md" />

      <h1 className="text-2xl font-bold text-primary-foreground text-center mb-2">
        Peça qualquer coisa<br />sem sair de casa 🛵⚡
      </h1>
      <p className="text-primary-foreground/80 text-center text-sm mb-6">
        Entrega rápida na sua cidade 👊
      </p>

      <CitySelector
        cities={cities}
        selectedCity={selectedCity}
        loading={citiesLoading}
        onSelect={selectCity}
        onClear={clearCity}
      />

      <ActiveOrderBanner />

      {hasCity && (
        <div className="w-full max-w-sm space-y-4 mt-6 animate-fade-in">
          {/* Categories */}
          <div>
            <p className="text-sm font-semibold text-primary-foreground/80 mb-2 text-center">O que você precisa?</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: ShoppingBag, label: "Lanche", emoji: "🍔", action: () => { localStorage.setItem("preselect_category", "Lanche"); navigate("/cliente/livre"); } },
                { icon: Pill, label: "Remédio", emoji: "💊", action: () => navigate("/farmacias") },
                { icon: ShoppingCart, label: "Mercado", emoji: "🛒", action: () => { localStorage.setItem("preselect_category", "Mercado"); navigate("/cliente/livre"); } },
                { icon: Beer, label: "Bebida", emoji: "🍺", action: () => { localStorage.setItem("preselect_category", "Bebida"); navigate("/cliente/livre"); } },
                { icon: Croissant, label: "Padaria", emoji: "🥖", action: () => { localStorage.setItem("preselect_category", "Padaria"); navigate("/cliente/livre"); } },
                { icon: Beef, label: "Açougue", emoji: "🥩", action: () => { localStorage.setItem("preselect_category", "Açougue"); navigate("/cliente/livre"); } },
                { icon: Store, label: "Loja", emoji: "🏪", action: () => { localStorage.setItem("preselect_category", "Loja"); navigate("/cliente/livre"); } },
                { icon: FileText, label: "Documento", emoji: "📄", action: () => { localStorage.setItem("preselect_category", "Documento"); navigate("/cliente/livre"); } },
                { icon: MoreHorizontal, label: "Outros", emoji: "🧩", action: () => { localStorage.setItem("preselect_category", "Outros"); navigate("/cliente/livre"); } },
              ].map((cat) => (
                <button
                  key={cat.label}
                  onClick={cat.action}
                  className="flex flex-col items-center gap-1.5 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/20 py-3 px-2 text-primary-foreground transition-all active:scale-[0.95] hover:bg-primary-foreground/20"
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-[11px] font-semibold">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate("/cliente/livre")}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary-foreground py-5 text-lg font-bold text-primary shadow-xl transition-all active:scale-[0.97] hover:shadow-2xl"
          >
            <ShoppingBag className="h-6 w-6" />
            Fazer Pedido
          </button>

          <button
            onClick={() => navigate("/motoboy-acesso")}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-primary-foreground/30 bg-primary-foreground/10 py-5 text-lg font-bold text-primary-foreground shadow-lg transition-all active:scale-[0.97] hover:bg-primary-foreground/20"
          >
            <Bike className="h-6 w-6" />
            Sou Motoboy
          </button>
        </div>
      )}

      {hasCity && (
        <div className="mt-5 flex flex-col items-center gap-2">
          <button
            onClick={() => navigate("/cadastro-motoboy")}
            className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors tracking-wide"
          >
            Quer ser motoboy? <span className="underline underline-offset-4 font-semibold">Cadastre-se aqui</span>
          </button>
        </div>
      )}

      <button
        onClick={() => navigate("/login")}
        className="mt-3 flex items-center gap-1.5 text-xs text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors"
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
