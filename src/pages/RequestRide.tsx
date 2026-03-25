import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Bike, Send, Loader2, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getRoute } from "@/hooks/useGeocoding";
import { useCurrentLocation } from "@/hooks/useGeocoding";
import AddressInput from "@/components/AddressInput";
import DeliveryMap from "@/components/DeliveryMap";
import PriceEstimate from "@/components/PriceEstimate";
import SearchingMotoboy from "@/components/SearchingMotoboy";
import BottomNav from "@/components/BottomNav";

const BASE_PRICE = 5;
const PRICE_PER_KM = 1;

type ServiceType = "entrega" | "corrida";
type FlowStep = "form" | "calculated" | "searching" | "found";

const RequestRide = () => {
  const navigate = useNavigate();
  const { getLocation, loading: locLoading } = useCurrentLocation();

  const [service, setService] = useState<ServiceType>("entrega");
  const [pickup, setPickup] = useState("");
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [delivery, setDelivery] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);
  const [itemDesc, setItemDesc] = useState("");
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [price, setPrice] = useState(0);
  const [step, setStep] = useState<FlowStep>("form");
  const [calculating, setCalculating] = useState(false);
  const [motoboyName, setMotoboyName] = useState("");
  const [motoboyPhone, setMotoboyPhone] = useState("");

  const customerName = localStorage.getItem("profile_name") || "";
  const customerPhone = localStorage.getItem("profile_phone") || "";

  // Auto-get location on mount
  useEffect(() => {
    handleUseLocation();
  }, []);

  const handleUseLocation = async () => {
    const loc = await getLocation();
    if (loc) {
      setPickup(loc.address.split(",").slice(0, 3).join(",").trim());
      setPickupCoords([loc.lat, loc.lon]);
    }
  };

  const handlePickupChange = (value: string, coords?: [number, number]) => {
    setPickup(value);
    if (coords) setPickupCoords(coords);
    setStep("form");
  };

  const handleDeliveryChange = (value: string, coords?: [number, number]) => {
    setDelivery(value);
    if (coords) setDeliveryCoords(coords);
    setStep("form");
  };

  const canCalculate = pickup.trim() && delivery.trim() && pickupCoords && deliveryCoords && itemDesc.trim();

  const handleCalculate = async () => {
    if (!pickupCoords || !deliveryCoords) return;
    setCalculating(true);

    const result = await getRoute(pickupCoords, deliveryCoords);
    setDistance(result.distance);
    setDuration(result.duration);
    setPrice(BASE_PRICE + PRICE_PER_KM * result.distance);
    setRouteCoords(result.coordinates);
    setStep("calculated");
    setCalculating(false);
  };

  const handleOrder = async () => {
    setStep("searching");

    // Find nearest available motoboy
    const { data: motoboys } = await supabase
      .from("motoboys")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: true });

    if (!motoboys || motoboys.length === 0) {
      // No motoboys — stay in searching state with notify option
      return;
    }

    // Sort by distance if coords available
    let chosen = motoboys[0];
    if (pickupCoords) {
      const sorted = motoboys
        .filter((m) => m.latitude && m.longitude)
        .map((m) => {
          const dlat = (m.latitude! - pickupCoords[0]) * 111;
          const dlng = (m.longitude! - pickupCoords[1]) * 111 * Math.cos((pickupCoords[0] * Math.PI) / 180);
          return { ...m, dist: Math.sqrt(dlat ** 2 + dlng ** 2) };
        })
        .sort((a, b) => a.dist - b.dist);
      if (sorted.length > 0) chosen = sorted[0];
    }

    // Save order to database
    await supabase.from("orders").insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      pickup_address: pickup,
      delivery_address: delivery,
      item_description: itemDesc,
      service_type: service,
      pickup_lat: pickupCoords?.[0],
      pickup_lng: pickupCoords?.[1],
      delivery_lat: deliveryCoords?.[0],
      delivery_lng: deliveryCoords?.[1],
      distance_km: distance,
      estimated_price: price,
      estimated_time_min: duration,
      motoboy_id: chosen.id,
      status: "pending",
    });

    // Save to localStorage for history
    const ride = {
      id: Date.now().toString(),
      motoboyId: chosen.id,
      motoboyName: chosen.name,
      motoboyPhoto: chosen.photo || "",
      motoboyPhone: chosen.phone,
      motoboyVehicle: chosen.vehicle,
      motoboyPlate: chosen.plate || "",
      pickupAddress: pickup,
      deliveryAddress: delivery,
      date: new Date().toISOString(),
    };
    const history = JSON.parse(localStorage.getItem("ride_history") || "[]");
    localStorage.setItem("ride_history", JSON.stringify([ride, ...history]));

    setMotoboyName(chosen.name);
    setMotoboyPhone(chosen.phone);

    // Simulate finding delay
    setTimeout(() => {
      setStep("found");

      // Build WhatsApp message
      const msg = encodeURIComponent(
        `Novo pedido disponível:\n\n📍 Retirada: ${pickup}\n📍 Entrega: ${delivery}\n📦 Item: ${itemDesc}\n💰 Valor: R$${price.toFixed(2)}\n⏱️ Tempo estimado: ${duration} min\n\nResponda 'ACEITAR' para pegar a corrida`
      );

      setTimeout(() => {
        window.open(`https://wa.me/${chosen.phone}?text=${msg}`, "_blank");
        navigate("/confirmacao", {
          state: {
            motoboy: {
              name: chosen.name,
              phone: chosen.phone,
              vehicle: chosen.vehicle,
              plate: chosen.plate,
              photo: chosen.photo,
            },
          },
        });
      }, 1500);
    }, 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* Header */}
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Solicitar Entrega</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Map */}
        <div className="animate-fade-in-up">
          <DeliveryMap
            pickupCoords={pickupCoords}
            deliveryCoords={deliveryCoords}
            routeCoords={routeCoords}
          />
        </div>

        {/* Service type */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            O que você precisa?
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => setService("entrega")}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all active:scale-[0.97] ${
                service === "entrega"
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              <Package className="h-4 w-4" />
              Entregar algo
            </button>
            <button
              onClick={() => setService("corrida")}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all active:scale-[0.97] ${
                service === "corrida"
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              <Bike className="h-4 w-4" />
              Ir até um local
            </button>
          </div>
        </div>

        {/* Addresses */}
        <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <AddressInput
            value={pickup}
            onChange={handlePickupChange}
            placeholder="De onde sai?"
            icon="pickup"
            onUseLocation={handleUseLocation}
            locationLoading={locLoading}
          />
          <AddressInput
            value={delivery}
            onChange={handleDeliveryChange}
            placeholder="Para onde vai?"
            icon="delivery"
          />
        </div>

        {/* Item description */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            O que será entregue?
          </label>
          <textarea
            value={itemDesc}
            onChange={(e) => setItemDesc(e.target.value)}
            placeholder="Ex: Documento, marmita, peça, etc..."
            rows={2}
            className="mt-1.5 w-full rounded-xl border bg-card py-3 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow"
          />
        </div>

        {/* Price estimate */}
        {step !== "form" && distance > 0 && (
          <PriceEstimate distance={distance} duration={duration} price={price} />
        )}

        {/* Searching / found status */}
        {(step === "searching" || step === "found") && (
          <SearchingMotoboy
            status={step === "found" ? "found" : "searching"}
            motoboyName={motoboyName}
          />
        )}

        {/* No motoboy fallback */}
        {step === "searching" && !motoboyName && (
          <div className="mt-2">
            <button
              onClick={() => {
                alert("Você será notificado quando um motoboy estiver disponível!");
                navigate("/");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-card py-3 text-sm font-semibold text-primary transition-all active:scale-[0.97] hover:bg-secondary"
            >
              <Bell className="h-4 w-4" />
              Avisar quando tiver disponível
            </button>
          </div>
        )}

        {/* Main action button */}
        {step === "form" && (
          <button
            onClick={handleCalculate}
            disabled={!canCalculate || calculating}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold transition-all active:scale-[0.97] shadow-lg ${
              canCalculate && !calculating
                ? "bg-primary text-primary-foreground hover:shadow-xl"
                : "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
            }`}
          >
            {calculating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Calculando...
              </>
            ) : (
              "CALCULAR ENTREGA"
            )}
          </button>
        )}

        {step === "calculated" && (
          <button
            onClick={handleOrder}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg transition-all active:scale-[0.97] hover:shadow-xl animate-fade-in-up"
          >
            <Send className="h-5 w-5" />
            PEDIR AGORA
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default RequestRide;
