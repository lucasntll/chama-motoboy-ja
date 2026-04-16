import { useState, useEffect, useRef } from "react";
import { dispatchOrderToMotoboys } from "@/lib/dispatchOrder";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Hash, Loader2, UserCheck, RotateCcw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentLocation } from "@/hooks/useGeocoding";
import { useClientData, type LastOrder } from "@/hooks/useClientData";
import PlaceSuggestionInput, { savePopularPlace } from "@/components/PlaceSuggestionInput";
import AddressInput from "@/components/AddressInput";
import SavedAddressPicker from "@/components/SavedAddressPicker";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const COMMISSION = 2;

const CATEGORIES = [
  { label: "🍔 Lanche", value: "Lanche" },
  { label: "💊 Remédio", value: "Remédio" },
  { label: "🛒 Mercado", value: "Mercado" },
  { label: "🍺 Bebida", value: "Bebida" },
  { label: "🥖 Padaria", value: "Padaria" },
  { label: "🥩 Açougue", value: "Açougue" },
  { label: "🏪 Loja", value: "Loja" },
  { label: "📄 Documento", value: "Documento" },
  { label: "🧩 Outros", value: "Outros" },
];

const FreeOrder = () => {
  const navigate = useNavigate();
  const { getLocation, loading: locLoading } = useCurrentLocation();
  const { data: clientData, lastOrder, hasSavedData, saveAfterOrder, removeAddress, setDefaultAddress } = useClientData();

  const [category, setCategory] = useState("");
  const [orderDesc, setOrderDesc] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);
  const [houseRef, setHouseRef] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const cityId = localStorage.getItem("selected_city_id") || null;

  useEffect(() => {
    // Handle preselected category from home
    const preselect = localStorage.getItem("preselect_category");
    if (preselect) {
      setCategory(preselect);
      localStorage.removeItem("preselect_category");
    }

    // Handle pharmacy order
    const pharmacyOrder = localStorage.getItem("pharmacy_order");
    if (pharmacyOrder) {
      try {
        const data = JSON.parse(pharmacyOrder);
        if (data.description) setOrderDesc(data.description.replace(/^Remédio:\s*/, ""));
        if (data.description) setCategory("Remédio");
        if (data.purchaseLocation) setPurchaseLocation(data.purchaseLocation);
      } catch {}
      localStorage.removeItem("pharmacy_order");
    }

    if (hasSavedData) {
      if (clientData.name) setCustomerName(clientData.name);
      if (clientData.phone) setCustomerPhone(clientData.phone);
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

  const applyLastOrder = () => {
    if (!lastOrder) return;
    setCategory(lastOrder.category);
    setOrderDesc(lastOrder.orderDesc);
    setPurchaseLocation(lastOrder.purchaseLocation);
    setDeliveryAddress(lastOrder.deliveryAddress);
    setDeliveryCoords(lastOrder.deliveryCoords);
    setHouseRef(lastOrder.houseRef);
    setCustomerName(lastOrder.customerName);
    setCustomerPhone(lastOrder.customerPhone);
    toast.success("Último pedido carregado!");
  };

  const applySavedData = () => {
    if (clientData.name) setCustomerName(clientData.name);
    if (clientData.phone) setCustomerPhone(clientData.phone);
    const defaultAddr = clientData.addresses.find((a) => a.isDefault) || clientData.addresses[0];
    if (defaultAddr) {
      setDeliveryAddress(defaultAddr.address);
      setHouseRef(defaultAddr.houseRef);
      if (defaultAddr.coords) setDeliveryCoords(defaultAddr.coords);
    }
    toast.success("Dados preenchidos!");
  };

  const fullDescription = category ? `${category}: ${orderDesc}`.trim() : orderDesc;
  const canOrder = orderDesc.trim() && deliveryAddress.trim() && houseRef.trim() && customerName.trim() && customerPhone.trim();

  const handleSubmit = async () => {
    if (!orderDesc.trim()) {
      toast.error("Descreva o que você precisa 👊");
      descRef.current?.focus();
      return;
    }
    if (!canOrder || submitting) return;
    setSubmitting(true);

    if (purchaseLocation.trim()) savePopularPlace(purchaseLocation);

    const fullAddress = `${deliveryAddress} - ${houseRef}`;

    // Insert order as pending first
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
      estimated_time_min: 30,
      commission_amount: COMMISSION,
      status: "pending",
      order_type: "free",
      city_id: cityId || null,
    }).select("id").single();

    saveAfterOrder({
      category,
      orderDesc,
      purchaseLocation,
      deliveryAddress,
      deliveryCoords,
      houseRef,
      customerName,
      customerPhone,
    });

    localStorage.setItem("client_phone", customerPhone.replace(/\D/g, ""));

    if (inserted?.id) {
      // Local push (foreground): order created
      const { notifyOrderCreated } = await import("@/lib/despiaNotifications");
      notifyOrderCreated(inserted.id);

      // Web push (background): notify the customer device
      const { sendPushNotification } = await import("@/lib/sendPushNotification");
      sendPushNotification({
        event: "order_created",
        order_id: inserted.id,
        customer_phone: customerPhone.replace(/\D/g, ""),
      });

      // Dispatch to up to 2 available motoboys
      const dispatched = await dispatchOrderToMotoboys(inserted.id, cityId);

      if (dispatched.length === 0) {
        // No motoboys available, move to queue
        await supabase.from("orders").update({ status: "queued" } as any).eq("id", inserted.id);
        toast("Todos os motoboys estão em entrega. Seu pedido entrou na fila! 👊", { duration: 5000 });
      }

      setSubmitting(false);
      navigate(`/acompanhar/${inserted.id}`);
    } else {
      setSubmitting(false);
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate("/")} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Novo Pedido</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 pb-6">

        {customerName.trim() && (
          <div className="rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3 animate-fade-in">
            <p className="text-base font-bold text-foreground">Olá, {customerName.trim()} 👋</p>
            <p className="text-sm text-muted-foreground">O que vamos pedir hoje?</p>
          </div>
        )}

        {(hasSavedData || lastOrder) && (
          <div className="flex gap-2">
            {hasSavedData && (
              <button type="button" onClick={applySavedData}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border bg-card py-3 text-sm font-semibold text-primary hover:bg-secondary transition-colors active:scale-[0.97]">
                <UserCheck className="h-4 w-4" /> Usar dados salvos
              </button>
            )}
            {lastOrder && (
              <button type="button" onClick={applyLastOrder}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border bg-card py-3 text-sm font-semibold text-primary hover:bg-secondary transition-colors active:scale-[0.97]">
                <RotateCcw className="h-4 w-4" /> Repetir último
              </button>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Seu nome</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Como você se chama?"
              className="mt-1 w-full rounded-xl border bg-card py-3.5 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Seu telefone</label>
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(35) 99999-9999" type="tel"
              className="mt-1 w-full rounded-xl border bg-card py-3.5 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">O que você precisa?</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((cat, i) => (
              <button key={cat.value}
                onClick={() => {
                  const newCat = category === cat.value ? "" : cat.value;
                  setCategory(newCat);
                  if (newCat === "Outros") setTimeout(() => descRef.current?.focus(), 100);
                }}
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
                className={`animate-scale-in rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                  category === cat.value
                    ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30 scale-105"
                    : "bg-card border text-foreground hover:bg-secondary hover:scale-105"
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
          <textarea ref={descRef} value={orderDesc} onChange={(e) => setOrderDesc(e.target.value)}
            placeholder={category === "Outros" ? "Descreva exatamente o que você precisa" : "Descreva o que precisa (ex: 2 marmitas)"}
            rows={2}
            className="mt-3 w-full rounded-xl border bg-card py-3 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            De onde vai sair? <span className="text-muted-foreground/60">(opcional)</span>
          </label>
          <div className="mt-1.5">
            <PlaceSuggestionInput value={purchaseLocation} onChange={setPurchaseLocation} placeholder="Ex: farmácia, mercado…" />
          </div>
        </div>

        {clientData.addresses.length > 0 && (
          <SavedAddressPicker addresses={clientData.addresses}
            onSelect={(addr) => {
              setDeliveryAddress(addr.address);
              setHouseRef(addr.houseRef);
              if (addr.coords) setDeliveryCoords(addr.coords);
              toast.success(`Endereço "${addr.label}" selecionado`);
            }}
            onRemove={removeAddress} onSetDefault={setDefaultAddress} />
        )}

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Onde entregar?</label>
          <div className="mt-1.5">
            <AddressInput value={deliveryAddress} onChange={handleDeliveryChange} placeholder="Seu endereço de entrega"
              icon="delivery" onUseLocation={handleUseLocation} locationLoading={locLoading} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Número da casa / referência *</label>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border bg-card px-4 py-3">
            <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
            <input value={houseRef} onChange={(e) => setHouseRef(e.target.value)} placeholder="Ex: 123, casa azul, portão preto"
              className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none" />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={!canOrder || submitting}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-5 text-lg font-bold transition-all active:scale-[0.97] shadow-lg ${
            canOrder && !submitting ? "bg-primary text-primary-foreground hover:shadow-xl" : "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
          }`}>
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>🛵 CHAMAR MOTOBOY</>}
        </button>
      </main>
      <BottomNav />
    </div>
  );
};

export default FreeOrder;
