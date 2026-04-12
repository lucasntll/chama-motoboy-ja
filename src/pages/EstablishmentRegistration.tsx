import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { openWhatsApp } from "@/lib/whatsapp";
import { applyPhoneMask, stripPhoneMask } from "@/lib/phoneMask";

const CATEGORIES = [
  "Restaurante", "Lanchonete", "Pizzaria", "Farmácia", "Mercado",
  "Padaria", "Açougue", "Pet Shop", "Loja", "Outro"
];

const EstablishmentRegistration = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = name.trim() && ownerName.trim() && phone.trim() && address.trim() && city.trim() && category;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    await supabase.from("establishment_applications").insert({
      name: name.trim(),
      owner_name: ownerName.trim(),
      phone: stripPhoneMask(phone),
      address: address.trim(),
      city: city.trim(),
      category,
      description: description.trim(),
    } as any);

    setSubmitting(false);
    setSubmitted(true);
    toast.success("Cadastro enviado com sucesso!");
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-center mb-2">Cadastro Enviado!</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Entraremos em contato pelo WhatsApp para liberar seu acesso.
        </p>

        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => openWhatsApp("5535997238628", `Olá Leonardo! Acabei de cadastrar o estabelecimento "${name}" no ChamaMoto. Gostaria de saber sobre a liberação do acesso.`)}
            className="w-full rounded-xl bg-[hsl(142,70%,45%)] py-4 text-base font-bold text-white active:scale-[0.97]"
          >
            💬 Falar com Leonardo
          </button>
          <button
            onClick={() => openWhatsApp("5535998309121", `Olá Lucas! Acabei de cadastrar o estabelecimento "${name}" no ChamaMoto. Gostaria de saber sobre a liberação do acesso.`)}
            className="w-full rounded-xl border-2 border-[hsl(142,70%,45%)] py-4 text-base font-bold text-[hsl(142,70%,45%)] active:scale-[0.97]"
          >
            💬 Falar com Lucas
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full rounded-xl border py-4 text-base font-bold text-foreground active:scale-[0.97]"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate("/")} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Cadastro de Estabelecimento</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 pb-6">
        <div className="text-center space-y-1">
          <Store className="h-10 w-10 mx-auto text-primary" />
          <h2 className="text-lg font-bold">Seja um parceiro ChamaMoto</h2>
          <p className="text-sm text-muted-foreground">Receba pedidos e aumente suas vendas</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Nome do estabelecimento *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pizzaria do João"
              className="mt-1 w-full rounded-xl border bg-card py-3.5 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Nome do responsável *</label>
            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Seu nome completo"
              className="mt-1 w-full rounded-xl border bg-card py-3.5 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Telefone *</label>
            <input value={phone} onChange={(e) => setPhone(applyPhoneMask(e.target.value))} type="tel" placeholder="(35) 99999-9999"
              className="mt-1 w-full rounded-xl border bg-card py-3.5 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Endereço *</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro"
              className="mt-1 w-full rounded-xl border bg-card py-3.5 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Cidade *</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: Cabo Verde"
              className="mt-1 w-full rounded-xl border bg-card py-3.5 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Categoria *</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                    category === cat ? "bg-primary text-primary-foreground shadow-md" : "bg-card border text-foreground hover:bg-secondary"
                  }`}>{cat}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Descrição (opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Conte um pouco sobre seu estabelecimento" rows={2}
              className="mt-1 w-full rounded-xl border bg-card py-3 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={!canSubmit || submitting}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-5 text-lg font-bold transition-all active:scale-[0.97] shadow-lg ${
            canSubmit && !submitting ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
          }`}>
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "📝 ENVIAR CADASTRO"}
        </button>
      </main>
    </div>
  );
};

export default EstablishmentRegistration;
