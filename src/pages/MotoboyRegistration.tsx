import { useState, useRef } from "react";
import { Camera, Upload, CheckCircle, Bike, Zap, MapPin, Clock, DollarSign, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { applyPhoneMask, stripPhoneMask } from "@/lib/phoneMask";

const VEHICLE_OPTIONS = ["Moto", "Bike", "Carro", "Outro"];

const BENEFITS = [
  { icon: DollarSign, label: "Ganhos diários", desc: "Receba por cada entrega realizada" },
  { icon: Zap, label: "Corridas automáticas", desc: "Receba pedidos direto no app" },
  { icon: MapPin, label: "Trabalhe na sua cidade", desc: "Sem precisar sair da sua região" },
  { icon: Clock, label: "Faça seu próprio horário", desc: "Você decide quando trabalhar" },
];

const MotoboyRegistration = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    address: "",
    vehicle_type: "",
    experience: "",
  });
  const [facePhoto, setFacePhoto] = useState<File | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [vehiclePreview, setVehiclePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (type: "face" | "vehicle", file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "face") { setFacePhoto(file); setFacePreview(url); }
    else { setVehiclePhoto(file); setVehiclePreview(url); }
  };

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("motoboy-photos").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("motoboy-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.phone || !form.city || !form.address || !form.vehicle_type) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (!facePhoto) {
      toast({ title: "Envie sua foto de rosto", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const faceUrl = await uploadFile(facePhoto, "faces");
      let vehicleUrl = null;
      if (vehiclePhoto) vehicleUrl = await uploadFile(vehiclePhoto, "vehicles");

      const { error } = await supabase.from("motoboy_applications" as any).insert({
        full_name: form.full_name,
        phone: stripPhoneMask(form.phone),
        city: form.city,
        address: form.address,
        vehicle_type: form.vehicle_type,
        experience: form.experience,
        face_photo_url: faceUrl,
        vehicle_photo_url: vehicleUrl,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "Erro ao enviar cadastro", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="animate-scale-in space-y-4 max-w-sm">
          <CheckCircle className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-2xl font-bold">Cadastro enviado com sucesso! 👊</h1>
          <p className="text-muted-foreground">
            Agora fale com a gente no WhatsApp para agilizar sua aprovação
          </p>
          <p className="text-sm text-muted-foreground rounded-lg bg-secondary p-3">
            Status: <span className="font-bold text-foreground">Pendente de aprovação</span>
          </p>
          <div className="space-y-2 pt-2">
            <a
              href="https://wa.me/5535998309121?text=Ol%C3%A1%2C%20acabei%20de%20me%20cadastrar%20como%20motoboy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(142,70%,45%)] py-3.5 text-sm font-bold text-white active:scale-[0.97] transition-transform"
            >
              <MessageCircle className="h-5 w-5" />
              Falar com suporte 1
            </a>
            <a
              href="https://wa.me/5535997238628?text=Ol%C3%A1%2C%20acabei%20de%20me%20cadastrar%20como%20motoboy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[hsl(142,70%,45%)] py-3.5 text-sm font-bold text-[hsl(142,70%,45%)] active:scale-[0.97] transition-transform"
            >
              <MessageCircle className="h-5 w-5" />
              Falar com suporte 2
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 px-6 py-16 text-center text-primary-foreground">
        <div className="mx-auto max-w-md animate-fade-in">
          <Bike className="mx-auto mb-4 h-12 w-12" />
          <h1 className="text-2xl font-bold leading-tight">Ganhe dinheiro fazendo entregas na sua cidade</h1>
          <p className="mt-3 text-sm opacity-90">Cadastre-se e comece a receber corridas diretamente pelo sistema</p>
          <button
            onClick={scrollToForm}
            className="mt-6 rounded-xl bg-background px-8 py-3 text-sm font-bold text-primary shadow-lg active:scale-[0.97] transition-transform"
          >
            Quero me cadastrar
          </button>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-md grid grid-cols-2 gap-3">
          {BENEFITS.map((b, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-4 text-center animate-scale-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <b.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-sm font-bold">{b.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section ref={formRef} className="px-6 pb-16">
        <div className="mx-auto max-w-md space-y-4">
          <h2 className="text-xl font-bold text-center">Preencha seus dados</h2>

          {[
            { key: "full_name", label: "Nome completo *", placeholder: "Seu nome completo" },
            { key: "phone", label: "Telefone (WhatsApp) *", placeholder: "(35) 99999-9999", type: "tel" },
            { key: "city", label: "Cidade *", placeholder: "Ex: Alfenas" },
            { key: "address", label: "Endereço *", placeholder: "Rua, número, bairro" },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-sm font-medium">{f.label}</label>
              <input
                type={f.type || "text"}
                value={(form as any)[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: f.key === "phone" ? applyPhoneMask(e.target.value) : e.target.value })}
                placeholder={f.placeholder}
                className="mt-1 w-full rounded-xl border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}

          <div>
            <label className="text-sm font-medium">Tipo de veículo *</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {VEHICLE_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => setForm({ ...form, vehicle_type: v })}
                  className={`rounded-full px-4 py-2 text-sm font-medium border transition-all ${
                    form.vehicle_type === v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Experiência como motoboy</label>
            <textarea
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              placeholder="Conte sobre sua experiência (opcional)"
              rows={3}
              className="mt-1 w-full rounded-xl border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Photo uploads */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Foto do rosto *</label>
              <label className="mt-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-4 cursor-pointer hover:border-primary transition-colors aspect-square overflow-hidden">
                {facePreview ? (
                  <img src={facePreview} alt="Rosto" className="h-full w-full object-cover rounded-lg" />
                ) : (
                  <>
                    <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-[11px] text-muted-foreground">Enviar foto</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange("face", e.target.files?.[0] || null)} />
              </label>
            </div>
            <div>
              <label className="text-sm font-medium">Foto do veículo</label>
              <label className="mt-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-4 cursor-pointer hover:border-primary transition-colors aspect-square overflow-hidden">
                {vehiclePreview ? (
                  <img src={vehiclePreview} alt="Veículo" className="h-full w-full object-cover rounded-lg" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-[11px] text-muted-foreground">Opcional</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange("vehicle", e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Enviar cadastro"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default MotoboyRegistration;
