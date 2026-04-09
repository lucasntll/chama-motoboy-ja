import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Bell, Hash, Loader2 } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentLocation } from "@/hooks/useGeocoding";
import { useClientData } from "@/hooks/useClientData";
import AddressInput from "@/components/AddressInput";
import PlaceSuggestionInput, { savePopularPlace } from "@/components/PlaceSuggestionInput";
import SearchingMotoboy from "@/components/SearchingMotoboy";
import BottomNav from "@/components/BottomNav";

const COMMISSION = 2;
const GILBERTO_PHONE = "5535999198318";
const GILBERTO_NAME = "Gilberto";

type FlowStep = "form" | "searching" | "found" | "confirmed";

const RequestRide = () => {
  const navigate = useNavigate();
  const { getLocation, loading: locLoading } = useCurrentLocation();
  const { data: clientData, hasSavedData, saveAfterOrder } = useClientData();

  const [orderDesc, setOrderDesc] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);
  const [houseRef, setHouseRef] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [step, setStep] = useState<FlowStep>("form");
  const [motoboyName, setMotoboyName] = useState("");

  const customerName = clientData.name || "";
  const customerPhone = clientData.phone || "";

  useEffect(() => {
    if (hasSavedData) {
      const defaultAddr = clientData.addresses.find((a) => a.isDefault) || clientData.addresses[0];
      if (defaultAddr) {
        setDeliveryAddress(defaultAddr.address);
        setHouseRef(defaultAddr.houseRef);
        if (defaultAddr.coords) setDeliveryCoords(defaultAddr.coords);
      }
    } else {
      handleUseLocation();
    }
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

  const canOrder = orderDesc.trim() && deliveryAddress.trim() && houseRef.trim();

  const handleOrder = async () => {
    if (!canOrder) return;
    setStep("searching");

    const fullAddress = `${deliveryAddress} - ${houseRef}`;

    if (purchaseLocation.trim()) {
      savePopularPlace(purchaseLocation);
    }

    const { data: gilbertoRow } = await supabase
      .from("motoboys")
      .select("id")
      .eq("phone", GILBERTO_PHONE)
      .maybeSingle();

    const motoboyDbId = gilbertoRow?.id ?? null;

    await supabase.from("orders").insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: fullAddress,
      item_description: orderDesc,
      purchase_location: purchaseLocation,
      house_reference: houseRef,
      service_type: "compra_entrega",
      delivery_lat: deliveryCoords?.[0],
      delivery_lng: deliveryCoords?.[1],
      estimated_time_min: 25,
      commission_amount: COMMISSION,
      motoboy_id: motoboyDbId,
      status: "pending",
    } as any);

    const ride = {
      id: Date.now().toString(),
      motoboyName: GILBERTO_NAME,
      motoboyPhone: GILBERTO_PHONE,
      orderDesc,
      deliveryAddress: fullAddress,
      date: new Date().toISOString(),
      status: "pending",
    };
    const history = JSON.parse(localStorage.getItem("ride_history") || "[]");
    localStorage.setItem("ride_history", JSON.stringify([ride, ...history]));

    saveAfterOrder({
      category: "",
      orderDesc,
      purchaseLocation,
      deliveryAddress,
      deliveryCoords,
      houseRef,
      customerName,
      customerPhone,
    });

    setMotoboyName(GILBERTO_NAME);

    const mapsLink = deliveryCoords
      ? `https://www.google.com/maps?q=${deliveryCoords[0]},${deliveryCoords[1]}`
      : "";

    const msgText = `Novo pedido! 🚀\n\n🛒 *Pedido:* ${orderDesc}${purchaseLocation ? `\n🏪 *Local:* ${purchaseLocation}` : ""}\n📍 *Entregar em:* ${fullAddress}\n🏠 *Referência:* ${houseRef}\n🗺️ *Mapa:* ${mapsLink}\n👤 *Cliente:* ${customerName}\n📞 *Telefone:* ${customerPhone}\n\nResponda ACEITAR para pegar`;

    setTimeout(() => {
      setStep("found");
      setTimeout(() => {
        setStep("confirmed");
      }, 1500);
    }, 2000);

    localStorage.setItem("pending_wpp_msg", whatsappUrl(GILBERTO_PHONE, msgText));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Chamar Motoboy</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {step === "confirmed" ? (
          <ConfirmedView motoboyName={motoboyName} />
        ) : (
          <>
            <div className="animate-fade-in-up">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                O que você quer?
              </label>
              <textarea
                value={orderDesc}
                onChange={(e) => setOrderDesc(e.target.value)}
                placeholder="Ex: açaí, remédio, lanche…"
                rows={2}
                className="mt-1.5 w-full rounded-xl border bg-card py-3 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

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

            <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Número da casa / referência *
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border bg-card px-4 py-3">
                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  value={houseRef}
                  onChange={(e) => setHouseRef(e.target.value)}
                  placeholder="Ex: 123, casa azul, portão preto"
                  className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                De onde vai sair? <span className="text-muted-foreground/60">(opcional)</span>
              </label>
              <div className="mt-1.5">
                <PlaceSuggestionInput
                  value={purchaseLocation}
                  onChange={(v) => setPurchaseLocation(v)}
                  placeholder="Ex: farmácia, mercado…"
                />
              </div>
            </div>

            {(step === "searching" || step === "found") && (
              <SearchingMotoboy
                status={step === "found" ? "found" : "searching"}
                motoboyName={motoboyName}
              />
            )}

            {step === "searching" && !motoboyName && (
              <button
                onClick={() => {
                  alert("Você será notificado quando um motoboy estiver disponível!");
                  navigate("/");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-card py-3 text-sm font-semibold text-primary active:scale-[0.97]"
              >
                <Bell className="h-4 w-4" />
                Avisar quando tiver disponível
              </button>
            )}

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
                CONFIRMAR PEDIDO
              </button>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

const ConfirmedView = ({ motoboyName }: { motoboyName: string }) => {
  const wppLink = localStorage.getItem("pending_wpp_msg") || whatsappUrl(GILBERTO_PHONE);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-fade-in-up">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <span className="text-4xl">🚀</span>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold">Pedido Confirmado!</h2>
        <p className="text-base text-muted-foreground">
          Agora é só enviar para o motoboy
        </p>
      </div>

      <div className="w-full rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-lg">
            G
          </div>
          <div>
            <p className="font-bold text-base">{motoboyName}</p>
            <p className="text-sm text-muted-foreground">📞 (35) 99919-8318</p>
          </div>
        </div>
      </div>

      <a
        href={wppLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(142,70%,45%)] py-4 text-base font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.97]"
      >
        📲 Enviar para {motoboyName}
      </a>

      <div className="w-full space-y-3">
        <StatusStep label="Pedido confirmado" active done />
        <StatusStep label="Enviado para motoboy" active done={false} />
        <StatusStep label="Entrega finalizada" active={false} done={false} />
      </div>
    </div>
  );
};


const StatusStep = ({ label, active, done }: { label: string; active: boolean; done: boolean }) => (
  <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
    <div className={`h-3 w-3 rounded-full ${done ? "bg-primary" : active ? "bg-primary animate-pulse" : "bg-muted"}`} />
    <span className={`text-sm font-medium ${done || active ? "text-foreground" : "text-muted-foreground"}`}>
      {label}
    </span>
  </div>
);

export default RequestRide;
