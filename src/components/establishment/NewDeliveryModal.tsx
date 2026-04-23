import { useEffect, useMemo, useState } from "react";
import { Loader2, X, Zap, ChevronDown, ChevronUp, BookmarkCheck } from "lucide-react";
import { searchCustomers, getSavedCustomers, type SavedCustomer } from "@/lib/establishmentCustomers";

interface Props {
 estId: string;
 establishment: any;
 initialMode: "fast" | "full";
 prefill?: Partial<SavedCustomer> | null;
 submitting: boolean;
 onClose: () => void;
 onSubmit: (data: {
 customerName: string;
 customerPhone: string;
 deliveryAddress: string;
 houseRef: string;
 itemDescription: string;
 }) => void;
}

const NewDeliveryModal = ({ estId, establishment, initialMode, prefill, submitting, onClose, onSubmit }: Props) => {
 const [mode, setMode] = useState<"fast" | "full">(initialMode);
 const [customerName, setCustomerName] = useState(prefill?.name || "");
 const [customerPhone, setCustomerPhone] = useState(prefill?.phone || "");
 const [houseRef, setHouseRef] = useState(prefill?.reference || "");
 const [itemDescription, setItemDescription] = useState(prefill?.note || "");
 const [showSaved, setShowSaved] = useState(false);
 const [showOptional, setShowOptional] = useState(!!(prefill?.phone || prefill?.note));

 const allSaved = useMemo(() => getSavedCustomers(estId), [estId]);
 const suggestions = useMemo(() => {
 const q = customerName || customerPhone;
 if (!q || q.length < 2) return [];
 return searchCustomers(estId, q);
 }, [customerName, customerPhone, estId]);

 useEffect(() => {
 setMode(initialMode);
 }, [initialMode]);

 const applyCustomer = (c: SavedCustomer) => {
 setCustomerName(c.name);
 setCustomerPhone(c.phone);
 setHouseRef(c.reference);
 setItemDescription(c.note);
 setShowSaved(false);
 if (c.phone || c.note) setShowOptional(true);
 };

 const handleSubmit = () => {
 const estAddress = [establishment?.address, establishment?.address_number].filter(Boolean).join(", ")
 || establishment?.address
 || "";
 onSubmit({
 customerName,
 customerPhone,
 deliveryAddress: estAddress,
 houseRef,
 itemDescription,
 });
 };

 const isFast = mode === "fast";

 return (
 <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
 <div className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto">
 <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
 <h2 className="text-lg font-bold flex items-center gap-2">
 {isFast ? <><Zap className="h-5 w-5 text-primary" /> Entrega Rápida</> : <> Nova Entrega</>}
 </h2>
 <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
 <X className="h-5 w-5" />
 </button>
 </div>

 <div className="p-4 space-y-3">
 {/* Toggle modo */}
 <div className="flex gap-2 rounded-xl bg-secondary p-1">
 <button
 onClick={() => setMode("fast")}
 className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${isFast ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}
 >
 Rápida
 </button>
 <button
 onClick={() => setMode("full")}
 className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${!isFast ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}
 >
 Completa
 </button>
 </div>

 {/* Botão usar endereço salvo */}
 {allSaved.length > 0 && (
 <button
 onClick={() => setShowSaved((v) => !v)}
 className="w-full flex items-center justify-between rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-bold text-primary"
 >
 <span className="flex items-center gap-2">
 <BookmarkCheck className="h-4 w-4" /> USAR ENDEREÇO SALVO
 </span>
 {showSaved ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
 </button>
 )}

 {showSaved && (
 <div className="rounded-xl border bg-muted/30 max-h-60 overflow-y-auto divide-y">
 {allSaved.map((c, i) => (
 <button
 key={i}
 onClick={() => applyCustomer(c)}
 className="w-full text-left p-3 hover:bg-secondary/60 active:bg-secondary"
 >
 <p className="text-sm font-bold truncate">{c.name}</p>
 <p className="text-xs text-muted-foreground truncate">{c.address}</p>
 {c.reference && <p className="text-xs text-muted-foreground/80 truncate"> {c.reference}</p>}
 </button>
 ))}
 </div>
 )}

 {/* Nome */}
 <div className="relative">
 <label className="text-xs font-bold text-muted-foreground uppercase">Nome do cliente</label>
 <input
 type="text"
 value={customerName}
 onChange={(e) => setCustomerName(e.target.value)}
 placeholder="Ex: João Silva"
 className="mt-1 w-full rounded-xl border bg-background py-3 px-4 text-base font-medium"
 autoFocus
 />
 {suggestions.length > 0 && customerName.length >= 2 && (
 <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl border bg-card shadow-lg max-h-48 overflow-y-auto divide-y">
 {suggestions.map((c, i) => (
 <button
 key={i}
 onClick={() => applyCustomer(c)}
 className="w-full text-left p-3 hover:bg-secondary/60 active:bg-secondary"
 >
 <p className="text-sm font-bold truncate">{c.name}</p>
 <p className="text-xs text-muted-foreground truncate">{c.address}</p>
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Referência */}
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">Número / Referência</label>
 <input
 type="text"
 value={houseRef}
 onChange={(e) => setHouseRef(e.target.value)}
 placeholder="Ex: nº 123 - portão azul"
 className="mt-1 w-full rounded-xl border bg-background py-3 px-4 text-base font-medium"
 />
 </div>

 {/* Toggle opcionais (modo rápido) */}
 {isFast && !showOptional && (
 <button
 onClick={() => setShowOptional(true)}
 className="w-full text-xs font-bold text-muted-foreground py-2 underline"
 >
 + adicionar telefone e observação (opcional)
 </button>
 )}

 {(showOptional || !isFast) && (
 <>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">
 Telefone {isFast && <span className="text-muted-foreground/60">(opcional)</span>}
 </label>
 <input
 type="tel"
 value={customerPhone}
 onChange={(e) => setCustomerPhone(e.target.value)}
 placeholder="(35) 99999-9999"
 className="mt-1 w-full rounded-xl border bg-background py-3 px-4 text-base font-medium"
 />
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">
 Observação {isFast && <span className="text-muted-foreground/60">(opcional)</span>}
 </label>
 <textarea
 value={itemDescription}
 onChange={(e) => setItemDescription(e.target.value)}
 placeholder="Ex: 2 x-burguer + coca / remédio / documento"
 rows={2}
 className="mt-1 w-full rounded-xl border bg-background py-3 px-4 text-base font-medium resize-none"
 />
 </div>
 </>
 )}

 {/* Origem auto */}
 <div className="rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
 <p className="font-bold mb-1"> Retirada (automática):</p>
 <p className="font-semibold text-foreground">{establishment?.name}</p>
 <p>{[establishment?.address, establishment?.address_number].filter(Boolean).join(", ") || "Endereço não cadastrado"}</p>
 {establishment?.neighborhood && <p>{establishment.neighborhood}</p>}
 </div>

 <button
 onClick={handleSubmit}
 disabled={submitting}
 className="w-full rounded-2xl bg-primary py-5 text-lg font-extrabold text-primary-foreground active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : isFast ? <> ENVIAR AGORA</> : <> CHAMAR MOTOBOY</>}
 </button>
 </div>
 </div>
 </div>
 );
};

export default NewDeliveryModal;