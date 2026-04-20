import { Store, Bike, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo-chamamoto.png";
import CitySelector from "@/components/CitySelector";
import { useCitySelection } from "@/hooks/useCitySelection";

const Index = () => {
  const navigate = useNavigate();
  const { cities, selectedCity, loading: citiesLoading, selectCity, clearCity } = useCitySelection();

  const hasCity = !!selectedCity;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary px-6 py-10">
      <img src={logo} alt="ChamaMoto" className="h-28 w-auto mb-6 drop-shadow-md" />

      <h1 className="text-2xl font-bold text-primary-foreground text-center mb-2">
        ChamaMoto 🛵⚡
      </h1>
      <p className="text-primary-foreground/80 text-center text-sm mb-6">
        Sua entrega rápida, sem complicação
      </p>

      <CitySelector
        cities={cities}
        selectedCity={selectedCity}
        loading={citiesLoading}
        onSelect={selectCity}
        onClear={clearCity}
      />

      {hasCity && (
        <div className="w-full max-w-sm space-y-4 mt-6 animate-fade-in">
          <button
            onClick={() => navigate("/estabelecimento-acesso")}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary-foreground py-5 text-lg font-bold text-primary shadow-xl transition-all active:scale-[0.97] hover:shadow-2xl"
          >
            <Store className="h-6 w-6" />
            Sou Estabelecimento
          </button>

          <button
            onClick={() => navigate("/motoboy-acesso")}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-primary-foreground/30 bg-primary-foreground/10 py-5 text-lg font-bold text-primary-foreground shadow-lg transition-all active:scale-[0.97] hover:bg-primary-foreground/20"
          >
            <Bike className="h-6 w-6" />
            Sou Motoboy
          </button>

          <button
            onClick={() => navigate("/login")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary-foreground/20 bg-transparent py-3.5 text-sm font-semibold text-primary-foreground/80 transition-all active:scale-[0.97] hover:bg-primary-foreground/10"
          >
            <Settings className="h-4 w-4" />
            Admin
          </button>
        </div>
      )}

      {hasCity && (
        <button
          onClick={() => navigate("/cadastro-motoboy")}
          className="mt-5 text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors tracking-wide"
        >
          Quer ser motoboy? <span className="underline underline-offset-4 font-semibold">Cadastre-se aqui</span>
        </button>
      )}

      <p className="mt-6 text-xs text-primary-foreground/50">
        ChamaMoto © {new Date().getFullYear()}
      </p>
    </div>
  );
};

export default Index;
