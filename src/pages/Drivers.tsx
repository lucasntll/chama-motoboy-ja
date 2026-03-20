import { useState } from "react";
import { MOTOBOYS, REGIONS } from "@/lib/data";
import MotoboyCard from "@/components/MotoboyCard";
import BottomNav from "@/components/BottomNav";

const Drivers = () => {
  const [region, setRegion] = useState("Todos");
  const filtered = region === "Todos" ? MOTOBOYS : MOTOBOYS.filter((m) => m.region === region);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="border-b bg-card px-5 py-4">
        <h1 className="text-lg font-bold">Motoboys Disponíveis</h1>
      </header>

      <main className="flex-1 px-5 py-4 space-y-4">
        <div className="flex flex-wrap gap-2 animate-fade-in-up">
          {REGIONS.map((r) => (
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

        <div className="space-y-2">
          {filtered.map((m, i) => (
            <div key={m.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <MotoboyCard motoboy={m} />
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhum motoboy nessa região no momento.
            </p>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Drivers;
