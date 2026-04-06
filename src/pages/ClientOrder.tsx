import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Hash, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentLocation } from "@/hooks/useGeocoding";
import PlaceSuggestionInput, { savePopularPlace } from "@/components/PlaceSuggestionInput";
import AddressInput from "@/components/AddressInput";

const CATEGORIES = [
  { label: "🍔 Lanche", value: "Lanche" },
  { label: "💊 Remédio", value: "Remédio" },
  { label: "🛒 Mercado", value: "Mercado" },
  { label: "🍺 Bebida", value: "Bebida" },
  { label: "📄 Documento", value: "Documento" },
];

const ClientOrder = () => {
  const navigate = useNavigate();
  const { getLocation, loading: locLoading } = useCurrentLocation();

  const [category, setCategory] = useState("");
  const [orderDesc, setOrderDesc] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);
  const [houseRef, setHouseRef] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

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

  const fullDescription = category ? `${category}: ${orderDesc}`.trim() : orderDesc;
  const canOrder = fullDescription.trim() && deliveryAddress.trim() && houseRef.trim() && customerName.trim() && customerPhone.trim();

  const handleSubmit = async () => {
    if (!canOrder || submitting) return;
    setSubmitting(true);

    if (purchaseLocation.trim()) {
      savePopularPlace(purchaseLocation);
    }

    const fullAddress = `${deliveryAddress} - ${houseRef}`;

    const { data: inserted } = await supabase.from("orders").insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: fullAddress,
      item_description: fullDescription,
      purchase_location: purchaseLocation,
      house_reference: houseRef,
      service_type: "compra_entrega",
      delivery_lat: deliveryCoords?.[0],
      delivery_lng: deliveryCoords?.[1],
      estimated_price: 7,
      estimated_time_min: 25,
      commission_amount: 1,
      status: "pending",
    } as any).select("id").single();

    setSubmitting(false);

    if (inserted?.id) {
      navigate(`/acompanhar/${inserted.id}`);
    } else {
      setConfirmed(true);
    }
  };

  if (confirmed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-center mb-2">Pedido Enviado!</h2>
        <p className="text-sm text-muted-foreground text-center mb-2">
          Aguardando motoboy aceitar sua corrida...
        </p>
        <p className="text-xs text-muted-foreground text-center mb-8">
          Você será notificado quando um motoboy aceitar
        </p>
        <button
          onClick={() => navigate("/")}
          className="w-full max-w-xs rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground active:scale-[0.97]"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate("/")} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Pedir Entrega</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 pb-6">
        {/* Customer info */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Seu nome</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Como você se chama?"
              className="mt-1 w-full rounded-xl border bg-card py-3.5 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Seu telefone</label>
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="(35) 99999-9999"
              type="tel"
              className="mt-1 w-full rounded-xl border bg-card py-3.5 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Category buttons */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">O que você quer?</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(category === cat.value ? "" : cat.value)}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                  category === cat.value
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card border text-foreground hover:bg-secondary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <textarea
            value={orderDesc}
            onChange={(e) => setOrderDesc(e.target.value)}
            placeholder="Descreva o que precisa (ex: 2 marmitas do restaurante X)"
            rows={2}
            className="mt-3 w-full rounded-xl border bg-card py-3 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Purchase location */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            De onde vai sair? <span className="text-muted-foreground/60">(opcional)</span>
          </label>
          <div className="mt-1.5">
            <PlaceSuggestionInput
              value={purchaseLocation}
              onChange={setPurchaseLocation}
              placeholder="Ex: farmácia, mercado…"
            />
          </div>
        </div>

        {/* Delivery address */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Onde entregar?</label>
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

        {/* House number */}
        <div>
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
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canOrder || submitting}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-5 text-lg font-bold transition-all active:scale-[0.97] shadow-lg ${
            canOrder && !submitting
              ? "bg-primary text-primary-foreground hover:shadow-xl"
              : "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
          }`}
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>🛵 CHAMAR MOTOBOY</>
          )}
        </button>
      </main>
    </div>
  );
};

export default ClientOrder;
