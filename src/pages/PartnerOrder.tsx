import { useState, useEffect, useRef } from "react";
import { sendPushNotification } from "@/lib/sendPushNotification";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Hash, Loader2, Store, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentLocation } from "@/hooks/useGeocoding";
import { useClientData } from "@/hooks/useClientData";
import AddressInput from "@/components/AddressInput";
import SavedAddressPicker from "@/components/SavedAddressPicker";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const COMMISSION = 2;

interface Establishment {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  is_open: boolean;
  photo_url: string | null;
}

const PartnerOrder = () => {
  const navigate = useNavigate();
  const { getLocation, loading: locLoading } = useCurrentLocation();
  const { data: clientData, hasSavedData, saveAfterOrder, removeAddress, setDefaultAddress } = useClientData();

  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);

  const [orderDesc, setOrderDesc] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(null);
  const [houseRef, setHouseRef] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const cityId = localStorage.getItem("selected_city_id") || "";

  useEffect(() => {
    loadEstablishments();
  }, []);

  useEffect(() => {
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

  const loadEstablishments = async () => {
    setLoading(true);
    let query = supabase
      .from("establishments")
      .select("id, name, category, address, phone, is_open, photo_url")
      .eq("status", "active");

    if (cityId) query = query.eq("city_id", cityId);

    const { data } = await query.order("name");
    setEstablishments(data || []);
    setLoading(false);
  };

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

  const canOrder = selectedEstablishment && orderDesc.trim() && deliveryAddress.trim() && houseRef.trim() && customerName.trim() && customerPhone.trim();

  const handleSubmit = async () => {
    if (!canOrder || submitting) return;
    setSubmitting(true);

    const fullAddress = `${deliveryAddress} - ${houseRef}`;

    const { data: inserted } = await supabase.from("orders").insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: fullAddress,
      item_description: orderDesc,
      house_reference: houseRef,
      service_type: "entrega",
      delivery_lat: deliveryCoords?.[0],
      delivery_lng: deliveryCoords?.[1],
      estimated_time_min: 25,
      commission_amount: COMMISSION,
      status: "awaiting_confirmation",
      order_type: "partner",
      establishment_id: selectedEstablishment.id,
      establishment_commission: 1,
      city_id: cityId || null,
    } as any).select("id").single();

    saveAfterOrder({
      category: "",
      orderDesc,
      purchaseLocation: selectedEstablishment.name,
      deliveryAddress,
      deliveryCoords,
      houseRef,
      customerName,
      customerPhone,
    });

    localStorage.setItem("client_phone", customerPhone.replace(/\D/g, ""));
    toast.success("Pedido enviado! Aguardando confirmação do estabelecimento.");
    setSubmitting(false);

    if (inserted?.id) {
      sendPushNotification({
        event: "new_order",
        order_id: inserted.id,
        city_id: cityId || undefined,
        customer_phone: customerPhone.replace(/\D/g, ""),
      });
      navigate(`/acompanhar/${inserted.id}`);
    } else {
      navigate("/");
    }
  };

  // Step 1: Choose establishment
  if (!selectedEstablishment) {
    return (
      <div className="flex min-h-screen flex-col bg-background pb-20">
        <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
          <button onClick={() => navigate("/cliente")} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">Escolha o estabelecimento</h1>
        </header>

        <main className="flex-1 px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : establishments.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Store className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Nenhum estabelecimento parceiro nesta cidade ainda.</p>
              <button onClick={() => navigate("/cliente/livre")} className="text-primary font-semibold underline">
                Fazer pedido livre →
              </button>
            </div>
          ) : (
            establishments.map((est) => (
              <button
                key={est.id}
                onClick={() => {
                  if (!est.is_open) {
                    toast.error(`${est.name} está fechado no momento`);
                    return;
                  }
                  setSelectedEstablishment(est);
                }}
                className={`w-full rounded-2xl border bg-card p-4 text-left transition-all active:scale-[0.98] ${
                  est.is_open ? "hover:border-primary/50 hover:shadow-md" : "opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                    {est.photo_url ? (
                      <img src={est.photo_url} alt={est.name} className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      est.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground truncate">{est.name}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        est.is_open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {est.is_open ? "Aberto" : "Fechado"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{est.category}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {est.address}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </main>
        <BottomNav />
      </div>
    );
  }

  // Step 2: Order form
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => setSelectedEstablishment(null)} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Pedir de {selectedEstablishment.name}</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 pb-6">
        <div className="rounded-2xl border bg-primary/5 border-primary/20 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">{selectedEstablishment.name}</p>
            <p className="text-xs text-muted-foreground">{selectedEstablishment.category} • {selectedEstablishment.address}</p>
          </div>
        </div>

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

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">O que você quer?</label>
          <textarea
            ref={descRef}
            value={orderDesc}
            onChange={(e) => setOrderDesc(e.target.value)}
            placeholder="Ex: 2 marmitas, 1 refrigerante..."
            rows={3}
            className="mt-1.5 w-full rounded-xl border bg-card py-3 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {clientData.addresses.length > 0 && (
          <SavedAddressPicker
            addresses={clientData.addresses}
            onSelect={(addr) => {
              setDeliveryAddress(addr.address);
              setHouseRef(addr.houseRef);
              if (addr.coords) setDeliveryCoords(addr.coords);
              toast.success(`Endereço "${addr.label}" selecionado`);
            }}
            onRemove={removeAddress}
            onSetDefault={setDefaultAddress}
          />
        )}

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

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Número da casa / referência *</label>
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

        <button
          onClick={handleSubmit}
          disabled={!canOrder || submitting}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-5 text-lg font-bold transition-all active:scale-[0.97] shadow-lg ${
            canOrder && !submitting
              ? "bg-primary text-primary-foreground hover:shadow-xl"
              : "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
          }`}
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>🛵 ENVIAR PEDIDO</>}
        </button>
      </main>
      <BottomNav />
    </div>
  );
};

export default PartnerOrder;
