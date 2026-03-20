import { Bike, Phone, MapPin } from "lucide-react";
import type { Motoboy } from "@/lib/data";
import StarRating from "./StarRating";

interface MotoboyCardProps {
  motoboy: Motoboy;
  onSelect?: (motoboy: Motoboy) => void;
  compact?: boolean;
}

const MotoboyCard = ({ motoboy, onSelect, compact }: MotoboyCardProps) => {
  const initials = motoboy.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

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
        <p className="font-semibold text-sm truncate">{motoboy.name}</p>
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
          </>
        )}
        <div className="flex items-center gap-2 mt-1">
          <StarRating rating={Math.round(motoboy.rating)} size={14} />
          <span className="text-xs text-muted-foreground">{motoboy.rating}</span>
        </div>
      </div>
      {!compact && (
        <a
          href={`https://wa.me/${motoboy.phone}`}
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
