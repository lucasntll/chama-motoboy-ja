import { Bike, Phone, MapPin, Clock } from "lucide-react";
import StarRating from "./StarRating";
import { whatsappUrl } from "@/lib/whatsapp";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MotoboyData {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate?: string;
  photo: string;
  region: string;
  rating: number;
  totalRides: number;
  status?: string;
  lastActivity?: string;
}

interface MotoboyCardProps {
  motoboy: MotoboyData;
  onSelect?: (motoboy: MotoboyData) => void;
  compact?: boolean;
}

const statusConfig: Record<string, { label: string; dot: string; color: string }> = {
  available: { label: "Disponível", dot: "🟢", color: "text-green-600" },
  busy: { label: "Ocupado", dot: "🔴", color: "text-red-500" },
  inactive: { label: "Inativo", dot: "⚪", color: "text-muted-foreground" },
};

const MotoboyCard = ({ motoboy, onSelect, compact }: MotoboyCardProps) => {
  const initials = motoboy.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const status = statusConfig[motoboy.status || "available"] || statusConfig.available;

  const lastActivityText = motoboy.lastActivity
    ? formatDistanceToNow(new Date(motoboy.lastActivity), { addSuffix: true, locale: ptBR })
    : null;

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-shadow duration-200 hover:shadow-md ${
        onSelect ? "cursor-pointer active:scale-[0.98]" : ""
      }`}
      onClick={() => onSelect?.(motoboy)}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-sm">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{motoboy.name}</p>
          <span className={`text-xs font-medium ${status.color}`}>
            {status.dot} {status.label}
          </span>
        </div>
        {!compact && (
          <>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Bike className="h-3.5 w-3.5" />
              <span className="truncate">{motoboy.vehicle} · {motoboy.plate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>{motoboy.region}</span>
            </div>
            {lastActivityText && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Ativo {lastActivityText}</span>
              </div>
            )}
          </>
        )}
        <div className="flex items-center gap-2 mt-1">
          <StarRating rating={Math.round(motoboy.rating)} size={14} />
          <span className="text-xs text-muted-foreground">{motoboy.rating}</span>
        </div>
      </div>
      {!compact && (
        <a
          href={whatsappUrl(motoboy.phone)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90"
        >
          <Phone className="h-4 w-4" />
        </a>
      )}
    </div>
  );
};

export default MotoboyCard;
