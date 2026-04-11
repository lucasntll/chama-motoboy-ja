import { MapPin, ChevronDown, Loader2 } from "lucide-react";
import type { City } from "@/hooks/useCitySelection";

interface CitySelectorProps {
  cities: City[];
  selectedCity: City | null;
  loading: boolean;
  onSelect: (city: City) => void;
  onClear: () => void;
}

const CitySelector = ({ cities, selectedCity, loading, onSelect, onClear }: CitySelectorProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-primary-foreground/10 px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
        <span className="text-sm text-primary-foreground/70">Carregando cidades...</span>
      </div>
    );
  }

  if (cities.length === 0) {
    return (
      <div className="rounded-2xl bg-primary-foreground/10 px-4 py-3 text-center">
        <p className="text-sm text-primary-foreground/70">Nenhuma cidade disponível no momento</p>
      </div>
    );
  }

  if (selectedCity) {
    return (
      <button
        onClick={onClear}
        className="flex items-center gap-2 rounded-full bg-primary-foreground/20 px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all active:scale-95 hover:bg-primary-foreground/30"
      >
        <MapPin className="h-4 w-4" />
        {selectedCity.name} - {selectedCity.state}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-2">
      <p className="text-sm font-semibold text-primary-foreground/90 text-center">📍 Selecione sua cidade</p>
      <div className="grid grid-cols-2 gap-2">
        {cities.map((city) => (
          <button
            key={city.id}
            onClick={() => onSelect(city)}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary-foreground/15 py-3 px-3 text-sm font-semibold text-primary-foreground transition-all active:scale-95 hover:bg-primary-foreground/25 border border-primary-foreground/20"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {city.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CitySelector;
