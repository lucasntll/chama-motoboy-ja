import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Send, Loader2, Bell, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentLocation } from "@/hooks/useGeocoding";
import AddressInput from "@/components/AddressInput";
import SearchingMotoboy from "@/components/SearchingMotoboy";
import BottomNav from "@/components/BottomNav";

const BASE_PRICE = 7;
const PRICE_PER_KM = 1.5;

type FlowStep = "form" | "searching" | "found";

const RequestRide = () => {
  const navigate = useNavigate();
  const { getLocation, loading: locLoading } = useCurrentLocation();

  const [orderDesc, setOrderDesc] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);
  const [step, setStep] = useState<FlowStep>("form");
  const [motoboyName, setMotoboyName] = useState("");

  const customerName = localStorage.getItem("profile_name") || "";
  const customerPhone = localStorage.getItem("profile_phone") || "";

  useEffect(() => {
    handleUseLocation();
  }, []);

  const handleUseLocation = async () => {
    const loc = await getLocation();
    if (loc) {
      setDeliveryAddress(loc.address.split(",").slice(0, 3).join(",").trim());
      setDeliveryCoords([loc.lat, loc.lon]);
    }
  };

  const handleDeliveryChange = (value: string, coords?: [number, number]) => {
    setDeliveryAddress(value);
    if (coords) setDeliveryCoords(coords);
  };

  const canOrder = orderDesc.trim() && deliveryAddress.trim();

  const estimatedPrice = BASE_PRICE + (purchaseLocation ? 3 : 0);
  const estimatedTime = 20 + (purchaseLocation ? 10 : 0);

  const handleOrder = async () => {
    if (!canOrder) return;
    setStep("searching");

    const { data: motoboys } = await supabase
      .from("motoboys")
      .select("*")
      .eq("is_available", true)
      .order("last_activity", { ascending: false });

    if (!motoboys || motoboys.length === 0) return;

    // Prefer available status, then by last activity
    const sorted = [...motoboys].sort((a, b) => {
      const statusOrder: Record<string, number> = { available: 0, busy: 1, inactive: 2 };
      const sa = statusOrder[(a as any).status] ?? 2;
      const sb = statusOrder[(b as any).status] ?? 2;
      if (sa !== sb) return sa - sb;
      return new Date((b as any).last_activity || 0).getTime() - new Date((a as any).last_activity || 0).getTime();
    });

    const chosen = sorted[0];

    await supabase.from("orders").insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      item_description: orderDesc,
      purchase_location: purchaseLocation,
      service_type: "compra_entrega",
      delivery_lat: deliveryCoords?.[0],
      delivery_lng: deliveryCoords?.[1],
      estimated_price: estimatedPrice,
      estimated_time_min: estimatedTime,
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
      pickupAddress: purchaseLocation || "A definir",
      deliveryAddress,
      date: new Date().toISOString(),
    };
    const history = JSON.parse(localStorage.getItem("ride_history") || "[]");
    localStorage.setItem("ride_history", JSON.stringify([ride, ...history]));

    setMotoboyName(chosen.name);

    const msg = encodeURIComponent(
      `Novo pedido:\n\n🛒 Pedido: ${orderDesc}${purchaseLocation ? `\n🏪 Local: ${purchaseLocation}` : ""}\n📍 Entregar em: ${deliveryAddress}\n💰 Ganho: R$${estimatedPrice.toFixed(2)}\n⏱️ Tempo estimado: ${estimatedTime} min\n\nResponda ACEITAR para pegar`
    );

    setTimeout(() => {
      setStep("found");

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
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Pedir Agora</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Order description */}
        <div className="animate-fade-in-up">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            O que você quer que a gente traga?
          </label>
          <textarea
            value={orderDesc}
            onChange={(e) => setOrderDesc(e.target.value)}
            placeholder="Ex: Açaí, lanche, remédio, bebida..."
            rows={3}
            className="mt-1.5 w-full rounded-xl border bg-card py-3 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow"
          />
        </div>

        {/* Delivery address */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Entregar onde?
          </label>
          <div className="mt-1.5">
            <AddressInput
              value={deliveryAddress}
              onChange={handleDeliveryChange}
              placeholder="Seu endereço de entrega"
              icon="delivery"
              onUseLocation={handleUseLocation}
              locationLoading={locLoading}
            />
          </div>
        </div>

        {/* Purchase location (optional) */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            De onde quer pedir? <span className="text-muted-foreground/60">(opcional)</span>
          </label>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border bg-card px-4 py-3">
            <Store className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={purchaseLocation}
              onChange={(e) => setPurchaseLocation(e.target.value)}
              placeholder="Ex: Farmácia São João, Padaria Central..."
              className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Price estimate */}
        {canOrder && (
          <div className="animate-fade-in-up rounded-xl border bg-card p-4 space-y-2" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">💰 Valor estimado</span>
              <span className="text-lg font-bold text-primary">R$ {estimatedPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">⏱️ Tempo estimado</span>
              <span className="text-sm font-semibold">{estimatedTime} min</span>
            </div>
          </div>
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
            onClick={handleOrder}
            disabled={!canOrder}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold transition-all active:scale-[0.97] shadow-lg ${
              canOrder
                ? "bg-primary text-primary-foreground hover:shadow-xl"
                : "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
            PEDIR AGORA
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default RequestRide;
