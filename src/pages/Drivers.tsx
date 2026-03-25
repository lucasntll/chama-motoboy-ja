import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import MotoboyCard from "@/components/MotoboyCard";
import BottomNav from "@/components/BottomNav";
import { Bike, Loader2 } from "lucide-react";

const Drivers = () => {
  const [motoboys, setMotoboys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState("Todos");

  useEffect(() => {
    const fetchMotoboys = async () => {
      const { data } = await supabase
        .from("motoboys")
        .select("*")
        .eq("is_available", true)
        .order("name");
      setMotoboys(data || []);
      setLoading(false);
    };
    fetchMotoboys();
  }, []);

  const regions = [...new Set(motoboys.map((m) => m.region))].sort();
  const filtered = region === "Todos" ? motoboys : motoboys.filter((m) => m.region === region);

  // Map DB fields to component interface
  const mapMotoboy = (m: any) => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    vehicle: m.vehicle,
    plate: m.plate || "",
    photo: m.photo || "",
    region: m.region,
    rating: Number(m.rating),
    totalRides: m.total_rides,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="border-b bg-card px-5 py-4">
        <h1 className="text-lg font-bold">Motoboys Disponíveis</h1>
      </header>

      <main className="flex-1 px-5 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
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
                  <MotoboyCard motoboy={mapMotoboy(m)} />
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
                    <Bike className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    🔄 Buscando motoboys próximos...
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Drivers;
