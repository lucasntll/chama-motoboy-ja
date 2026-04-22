import { Package, DollarSign, Clock } from "lucide-react";

interface Props {
  count: number;
  totalFee: number;
  avgMinutes: number | null;
}

const DaySummary = ({ count, totalFee, avgMinutes }: Props) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-2xl bg-card border p-3 text-center">
        <Package className="h-4 w-4 mx-auto text-primary mb-1" />
        <p className="text-lg font-extrabold leading-none">{count}</p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Hoje</p>
      </div>
      <div className="rounded-2xl bg-card border p-3 text-center">
        <DollarSign className="h-4 w-4 mx-auto text-primary mb-1" />
        <p className="text-lg font-extrabold leading-none">R${totalFee.toFixed(0)}</p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Acumulado</p>
      </div>
      <div className="rounded-2xl bg-card border p-3 text-center">
        <Clock className="h-4 w-4 mx-auto text-primary mb-1" />
        <p className="text-lg font-extrabold leading-none">{avgMinutes != null ? `${avgMinutes}m` : "—"}</p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Tempo médio</p>
      </div>
    </div>
  );
};

export default DaySummary;