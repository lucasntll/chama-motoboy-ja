import { useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { subscribeToPush } from "@/lib/pushSubscription";
import { toast } from "sonner";

interface Props {
  userType: "client" | "motoboy" | "establishment";
  referenceId: string;
  cityId?: string | null;
  onDismiss?: () => void;
}

const MESSAGES = {
  client: {
    title: "Acompanhe seu pedido em tempo real 🔔",
    description: "Receba atualizações sobre o status da sua entrega.",
    button: "Ativar notificações",
  },
  motoboy: {
    title: "Receba corridas em tempo real 🏍️",
    description: "Seja notificado imediatamente quando uma corrida estiver disponível.",
    button: "Ativar notificações",
  },
  establishment: {
    title: "Receba pedidos instantaneamente 🔔",
    description: "Não perca nenhum pedido — receba alertas em tempo real.",
    button: "Ativar notificações",
  },
};

const NotificationPermissionPrompt = ({ userType, referenceId, cityId, onDismiss }: Props) => {
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;
  if (Notification.permission === "granted") return null;

  const msg = MESSAGES[userType];

  const handleActivate = async () => {
    setLoading(true);
    const success = await subscribeToPush(userType, referenceId, cityId);
    setLoading(false);

    if (success) {
      toast.success("Notificações ativadas! ✅");
      onDismiss?.();
    } else if (Notification.permission === "denied") {
      setDenied(true);
    } else {
      toast.error("Não foi possível ativar as notificações.");
    }
  };

  if (denied) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
        <BellOff className="mx-auto h-8 w-8 text-amber-500 mb-2" />
        <p className="text-sm font-medium text-amber-800">
          Ative nas configurações do navegador para não perder pedidos
        </p>
        <button onClick={onDismiss} className="mt-2 text-xs text-amber-600 underline">
          Fechar
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
      {onDismiss && (
        <button onClick={onDismiss} className="absolute right-2 top-2 text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      )}
      <Bell className="mx-auto h-8 w-8 text-primary mb-2" />
      <p className="text-sm font-bold text-foreground mb-1">{msg.title}</p>
      <p className="text-xs text-muted-foreground mb-3">{msg.description}</p>
      <button
        onClick={handleActivate}
        disabled={loading}
        className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all active:scale-95 disabled:opacity-50"
      >
        {loading ? "Ativando..." : msg.button}
      </button>
    </div>
  );
};

export default NotificationPermissionPrompt;
