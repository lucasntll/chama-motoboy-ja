import { useState, useEffect } from "react";
import { Bell, BellOff, X, AlertTriangle, Settings } from "lucide-react";
import { subscribeToPush, getNotificationStatus } from "@/lib/pushSubscription";
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
  const [status, setStatus] = useState<"default" | "denied" | "unsupported" | "granted" | "ios_not_installed">("default");

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || (navigator as any).standalone === true;

  useEffect(() => {
    // iOS Safari requires PWA installation for push notifications
    if (isIOS && !isStandalone) {
      setStatus("ios_not_installed");
      return;
    }
    const s = getNotificationStatus();
    if (s === "unsupported") setStatus("unsupported");
    else if (s === "denied") setStatus("denied");
    else if (s === "granted") setStatus("granted");
    else setStatus("default");
  }, [isIOS, isStandalone]);

  // Don't show if already granted
  if (status === "granted") return null;

  const msg = MESSAGES[userType];

  const handleActivate = async () => {
    // iOS not installed as PWA
    if (isIOS && !isStandalone) {
      setStatus("ios_not_installed");
      return;
    }

    // Pre-check: if already denied, show instructions
    if ("Notification" in window && Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    setLoading(true);
    const result = await subscribeToPush(userType, referenceId, cityId);
    setLoading(false);

    if (result.success) {
      toast.success("Notificações ativadas com sucesso! ✅");
      setStatus("granted");
      onDismiss?.();
    } else if (result.reason === "denied") {
      setStatus("denied");
    } else if (result.reason === "unsupported") {
      // On iOS not standalone, show install instructions instead
      if (isIOS && !isStandalone) {
        setStatus("ios_not_installed");
      } else {
        setStatus("unsupported");
        toast.error("Seu navegador não suporta notificações push.");
      }
    } else if (result.reason === "sw_failed") {
      if (isIOS && !isStandalone) {
        setStatus("ios_not_installed");
      } else {
        toast.error("Erro ao registrar o serviço. Verifique se está usando HTTPS.");
      }
    } else {
      if (isIOS && !isStandalone) {
        setStatus("ios_not_installed");
      } else {
        toast.error("Não foi possível ativar as notificações. Tente novamente.");
      }
    }
  };

  // Unsupported browser
  if (status === "unsupported") {
    return (
      <div className="rounded-2xl border border-muted bg-muted/30 p-4 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground mb-1">
          Navegador não suportado
        </p>
        <p className="text-xs text-muted-foreground">
          Use o Chrome, Edge ou Firefox para receber notificações push.
        </p>
        {onDismiss && (
          <button onClick={onDismiss} className="mt-2 text-xs text-muted-foreground underline">
            Fechar
          </button>
        )}
      </div>
    );
  }

  // Permission denied — show manual instructions
  if (status === "denied") {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroid = /android/i.test(navigator.userAgent);

    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-center">
        <BellOff className="mx-auto h-8 w-8 text-destructive mb-2" />
        <p className="text-sm font-bold text-foreground mb-1">
          Notificações bloqueadas 🔇
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          As notificações estão bloqueadas pelo navegador. Ative manualmente nas configurações:
        </p>
        <div className="rounded-xl bg-background/80 p-3 text-left text-xs text-muted-foreground space-y-1.5 mb-3">
          {isIOS ? (
            <>
              <p>1. Abra <strong>Ajustes</strong> do iPhone</p>
              <p>2. Vá em <strong>Safari</strong> → <strong>Notificações</strong></p>
              <p>3. Encontre o ChamaMoto e ative</p>
            </>
          ) : isAndroid ? (
            <>
              <p>1. Toque no <strong>cadeado 🔒</strong> ao lado da URL</p>
              <p>2. Toque em <strong>Permissões</strong></p>
              <p>3. Ative <strong>Notificações</strong></p>
              <p>4. Recarregue a página</p>
            </>
          ) : (
            <>
              <p>1. Clique no <strong>cadeado 🔒</strong> ao lado da URL</p>
              <p>2. Em <strong>Notificações</strong>, selecione <strong>Permitir</strong></p>
              <p>3. Recarregue a página</p>
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Settings className="h-3 w-3" />
          <span>Configurações do navegador</span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="mt-2 text-xs text-muted-foreground underline">
            Fechar
          </button>
        )}
      </div>
    );
  }

  // Default state — show activation button
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
      <p className="mt-2 text-[10px] text-muted-foreground">
        Requer HTTPS • Funciona mesmo com o app fechado
      </p>
    </div>
  );
};

export default NotificationPermissionPrompt;
