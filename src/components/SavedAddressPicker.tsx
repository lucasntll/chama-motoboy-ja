import { Home, Briefcase, MapPin, Star, Trash2 } from "lucide-react";
import type { SavedAddress } from "@/hooks/useClientData";

interface Props {
  addresses: SavedAddress[];
  onSelect: (addr: SavedAddress) => void;
  onRemove?: (index: number) => void;
  onSetDefault?: (index: number) => void;
}

const iconMap = {
  Casa: Home,
  Trabalho: Briefcase,
  Outro: MapPin,
};

const SavedAddressPicker = ({ addresses, onSelect, onRemove, onSetDefault }: Props) => {
  if (!addresses.length) return null;

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Endereços salvos
      </label>
      <div className="flex flex-col gap-2">
        {addresses.map((addr, i) => {
          const Icon = iconMap[addr.label] || MapPin;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(addr)}
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-all active:scale-[0.98] hover:bg-secondary group"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold">{addr.label}</span>
                  {addr.isDefault && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {addr.address} {addr.houseRef ? `- ${addr.houseRef}` : ""}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onSetDefault && !addr.isDefault && (
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); onSetDefault(i); }}
                    className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"
                    title="Definir como padrão"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </span>
                )}
                {onRemove && (
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground"
                    title="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SavedAddressPicker;
