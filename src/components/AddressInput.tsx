import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { useGeocoding } from "@/hooks/useGeocoding";

interface AddressInputProps {
  value: string;
  onChange: (value: string, coords?: [number, number]) => void;
  placeholder: string;
  icon?: "pickup" | "delivery";
  onUseLocation?: () => void;
  locationLoading?: boolean;
}

const AddressInput = ({
  value,
  onChange,
  placeholder,
  icon = "pickup",
  onUseLocation,
  locationLoading,
}: AddressInputProps) => {
  const { suggestions, searchAddress, clearSuggestions } = useGeocoding();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = (text: string) => {
    onChange(text);
    searchAddress(text);
    setShowSuggestions(true);
  };

  const selectSuggestion = (s: { display_name: string; lat: number; lon: number }) => {
    const shortName = s.display_name.split(",").slice(0, 3).join(",").trim();
    onChange(shortName, [Number(s.lat), Number(s.lon)]);
    clearSuggestions();
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative flex items-center">
        <div
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full ${
            icon === "pickup" ? "bg-primary" : "bg-destructive"
          }`}
        />
        <input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border bg-card py-3.5 pl-10 pr-12 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
        {onUseLocation && (
          <button
            type="button"
            onClick={onUseLocation}
            disabled={locationLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-primary hover:bg-secondary transition-colors"
            title="Usar minha localização"
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border bg-card shadow-lg">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => selectSuggestion(s)}
              className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-sm hover:bg-secondary transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{s.display_name.split(",").slice(0, 3).join(",")}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
