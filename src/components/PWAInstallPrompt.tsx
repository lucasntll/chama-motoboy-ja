import { X, Download, Share, Plus, Zap, Smartphone, BellRing } from "lucide-react";
import logo from "@/assets/logo-chamamoto.png";

interface PWAInstallPromptProps {
  variant: "client" | "motoboy";
  isIOS: boolean;
  hasNativePrompt: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

const PWAInstallPrompt = ({ variant, isIOS, hasNativePrompt, onInstall, onDismiss }: PWAInstallPromptProps) => {
  const isMotoboy = variant === "motoboy";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in">
      <div className="w-full max-w-md animate-slide-up rounded-t-3xl bg-card p-6 pb-8 shadow-2xl">
        {/* Close */}
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <img src={logo} alt="ChamaMoto" className="h-16 w-16 rounded-2xl shadow-md" />
          <h2 className="text-lg font-bold text-foreground text-center">
            {isMotoboy
              ? "Instale o app para não perder corridas 👊"
              : "Instale o app 📱 e peça mais rápido na próxima 🚀"}
          </h2>
        </div>

        {/* Benefits */}
        <div className="space-y-2.5 mb-6">
          <Benefit icon={<Zap className="h-4 w-4 text-primary" />} text="Acesso mais rápido direto da tela inicial" />
          <Benefit icon={<Smartphone className="h-4 w-4 text-primary" />} text="Funciona como um app de verdade" />
          <Benefit
            icon={<BellRing className="h-4 w-4 text-primary" />}
            text={isMotoboy ? "Receba pedidos com mais agilidade" : "Acompanhe seus pedidos facilmente"}
          />
        </div>

        {isIOS ? (
          <IOSInstructions />
        ) : (
          <div className="space-y-3">
            <button
              onClick={onInstall}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg active:scale-[0.97] transition-transform"
            >
              <Download className="h-5 w-5" />
              Instalar agora
            </button>
            <button
              onClick={onDismiss}
              className="flex w-full items-center justify-center rounded-2xl py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Depois
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Benefit = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-2.5">
    {icon}
    <span className="text-sm font-medium text-foreground">{text}</span>
  </div>
);

const IOSInstructions = () => (
  <div className="space-y-4">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
      Como instalar no iPhone
    </p>
    <div className="space-y-3">
      <Step number={1} icon={<Share className="h-4 w-4" />} text='Toque no botão de compartilhar' />
      <Step number={2} icon={<Plus className="h-4 w-4" />} text='"Adicionar à Tela de Início"' />
      <Step number={3} icon={<Download className="h-4 w-4" />} text="Confirme a instalação" />
    </div>
  </div>
);

const Step = ({ number, icon, text }: { number: number; icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
      {number}
    </div>
    <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
      {icon} {text}
    </span>
  </div>
);

export default PWAInstallPrompt;
