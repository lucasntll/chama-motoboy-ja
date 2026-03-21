import { useState, useMemo } from "react";
import { getMotoboys, getRegions } from "@/lib/data";
import MotoboyCard from "@/components/MotoboyCard";
import BottomNav from "@/components/BottomNav";
import { Bike } from "lucide-react";

const Drivers = () => {
  const motoboys = useMemo(() => getMotoboys(), []);
  const regions = useMemo(() => getRegions(), []);
  const [region, setRegion] = useState("Todos");

  const filtered = region === "Todos" ? motoboys : motoboys.filter((m) => m.region === region);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="border-b bg-card px-5 py-4">
        <h1 className="text-lg font-bold">Motoboys Disponíveis</h1>
      </header>

      <main className="flex-1 px-5 py-4 space-y-4">
        {regions.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in-up">
            <button
              onClick={() => setRegion("Todos")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors active:scale-95 ${
                region === "Todos"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              Todos
            </button>
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors active:scale-95 ${
                  region === r
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((m, i) => (
            <div key={m.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <MotoboyCard motoboy={m} />
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bike className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum motoboy disponível no momento
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Drivers;
