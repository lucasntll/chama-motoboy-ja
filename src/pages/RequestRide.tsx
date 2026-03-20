import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Send } from "lucide-react";
import { MOTOBOYS, DEFAULT_PROFILE, REGIONS } from "@/lib/data";
import MotoboyCard from "@/components/MotoboyCard";
import BottomNav from "@/components/BottomNav";

const RequestRide = () => {
  const navigate = useNavigate();
  const [name] = useState(DEFAULT_PROFILE.name);
  const [phone] = useState(DEFAULT_PROFILE.phone);
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [service, setService] = useState<"entrega" | "corrida">("entrega");
  const [region, setRegion] = useState("Todos");
  const [selectedMotoboy, setSelectedMotoboy] = useState<string | null>(null);

  const filtered = region === "Todos" ? MOTOBOYS : MOTOBOYS.filter((m) => m.region === region);
  const chosen = MOTOBOYS.find((m) => m.id === selectedMotoboy);

  const handleSubmit = () => {
    if (!pickup || !delivery || !chosen) return;
    const msg = encodeURIComponent(
      `Olá! Preciso de uma ${service === "entrega" ? "entrega" : "corrida"} do endereço ${pickup} para ${delivery}. Você pode me atender?`
    );
    // Store ride in history
    const ride = {
      id: Date.now().toString(),
      motoboyId: chosen.id,
      motoboyName: chosen.name,
      motoboyPhoto: chosen.photo,
      motoboyPhone: chosen.phone,
      motoboyVehicle: chosen.vehicle,
      motoboyPlate: chosen.plate,
      pickupAddress: pickup,
      deliveryAddress: delivery,
      date: new Date().toISOString(),
    };
    const history = JSON.parse(localStorage.getItem("ride_history") || "[]");
    localStorage.setItem("ride_history", JSON.stringify([ride, ...history]));

    // Navigate to confirmation, then open WhatsApp
    navigate("/confirmacao", { state: { motoboy: chosen } });
    setTimeout(() => {
      window.open(`https://wa.me/${chosen.phone}?text=${msg}`, "_blank");
    }, 500);
  };

  const canSubmit = pickup.trim() && delivery.trim() && selectedMotoboy;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="flex items-center gap-3 border-b bg-card px-4 py-4">
        <button onClick={() => navigate(-1)} className="rounded-full p-1 active:scale-90 transition-transform">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Nova Solicitação</h1>
      </header>

      <main className="flex-1 px-5 py-5 space-y-5">
        {/* Service type */}
        <div className="animate-fade-in-up">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo de Serviço</label>
          <div className="mt-2 flex gap-2">
            {(["entrega", "corrida"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setService(s)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold capitalize transition-colors active:scale-[0.97] ${
                  service === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-secondary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Name & Phone (pre-filled) */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</label>
            <div className="mt-1.5 rounded-lg border bg-muted px-3 py-2.5 text-sm">{name}</div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Telefone</label>
            <div className="mt-1.5 rounded-lg border bg-muted px-3 py-2.5 text-sm truncate">{phone}</div>
          </div>
        </div>

        {/* Addresses */}
        <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Endereço de Retirada</label>
            <div className="relative mt-1.5">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <input
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Rua, número, bairro..."
                className="w-full rounded-lg border bg-card py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Endereço de Entrega</label>
            <div className="relative mt-1.5">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
              <input
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                placeholder="Rua, número, bairro..."
                className="w-full rounded-lg border bg-card py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Region filter */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtrar por região</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors active:scale-95 ${
                  region === r
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Motoboy list */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Escolha um Motoboy</label>
          <div className="mt-2 space-y-2">
            {filtered.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg transition-all ${
                  selectedMotoboy === m.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <MotoboyCard motoboy={m} onSelect={() => setSelectedMotoboy(m.id)} />
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all active:scale-[0.97] ${
            canSubmit
              ? "bg-primary text-primary-foreground shadow-lg hover:shadow-xl"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          <Send className="h-4 w-4" />
          Enviar Solicitação via WhatsApp
        </button>
      </main>

      <BottomNav />
    </div>
  );
};

export default RequestRide;
