import { DollarSign, Clock, MapPin } from "lucide-react";

interface PriceEstimateProps {
  distance: number;
  duration: number;
  price: number;
}

const PriceEstimate = ({ distance, duration, price }: PriceEstimateProps) => {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm animate-fade-in-up">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary p-3">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-foreground">{distance.toFixed(1)} km</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Distância</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary p-3">
          <Clock className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-foreground">{duration} min</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Tempo</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-primary/10 p-3">
          <DollarSign className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-primary">R${price.toFixed(2)}</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Valor</span>
        </div>
      </div>
    </div>
  );
};

export default PriceEstimate;
