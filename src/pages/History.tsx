import { useState, useEffect } from "react";
import { MapPin, Phone, Calendar } from "lucide-react";
import type { RideRequest } from "@/lib/data";
import StarRating from "@/components/StarRating";
import BottomNav from "@/components/BottomNav";

const History = () => {
  const [rides, setRides] = useState<RideRequest[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("ride_history") || "[]");
    setRides(stored);
  }, []);

  const handleRate = (rideId: string, value: number) => {
    const updated = rides.map((r) => (r.id === rideId ? { ...r, rating: value } : r));
    setRides(updated);
    localStorage.setItem("ride_history", JSON.stringify(updated));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="border-b bg-card px-5 py-4">
        <h1 className="text-lg font-bold">Histórico de Corridas</h1>
      </header>

      <main className="flex-1 px-5 py-4">
        {rides.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
            <Calendar className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma corrida realizada ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Suas solicitações aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rides.map((ride, i) => {
              const initials = ride.motoboyName.split(" ").map((n) => n[0]).join("").slice(0, 2);
              const date = new Date(ride.date);
              return (
                <div
                  key={ride.id}
                  className="rounded-xl border bg-card p-4 shadow-sm animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-xs">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{ride.motoboyName}</p>
                      <p className="text-xs text-muted-foreground">
                        {date.toLocaleDateString("pt-BR")} às {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <a
                      href={`https://wa.me/${ride.motoboyPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-90 transition-transform"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                      <span>{ride.pickupAddress}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-destructive shrink-0" />
                      <span>{ride.deliveryAddress}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Avaliar:</span>
                    <StarRating rating={ride.rating || 0} onRate={(v) => handleRate(ride.id, v)} size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default History;
