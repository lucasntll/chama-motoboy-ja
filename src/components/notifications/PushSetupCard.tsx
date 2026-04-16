import { useEffect, useState } from "react";
import { Bell, BellRing, Check, AlertCircle, Loader2, Share, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { canReceivePush, detectPlatform, isStandalonePWA } from "@/lib/platform";
import { usePushNotifications } from "@/hooks/useFCMNotifications";
import { usePWAInstall } from "@/hooks/usePWAInstall";

interface Props {
  /** Logical user type — used as platform discriminator for token storage. */
  userType: "client" | "motoboy" | "establishment";
  /** Stable identifier (phone, establishment id, motoboy id). */
  referenceId: string;
  userId?: string;
}

/**
 * Unified push notification setup card.
 * - Detects iOS vs Android
 * - Shows install instructions for iOS (required for push to work)
 * - Shows native install button for Android (when available)
 * - Only requests permission after explicit user click
 * - Stores token tagged with userType for targeted delivery
 */
export const PushSetupCard = ({ userType, referenceId, userId }: Props) => {
  const platform = detectPlatform();
  const [standalone, setStandalone] = useState(isStandalonePWA());
  const pushCheck = canReceivePush();

  // Tag platform with userType so backend can route by audience
  const platformTag = `${userType}-web`;

  const { permission, token, loading, error, enableNotifications } = usePushNotifications({
    referenceId,
    userId,
    platform: platformTag,
  });

  const { hasNativePrompt, installNative } = usePWAInstall();

  useEffect(() => {
    const recheck = () => setStandalone(isStandalonePWA());
    window.addEventListener("appinstalled", recheck);
    return () => window.removeEventListener("appinstalled", recheck);
  }, []);

  const handleEnable = async () => {
    const t = await enableNotifications();
    if (t) toast.success("Notificações ativadas! ✅");
  };

  const handleInstallAndroid = async () => {
    const ok = await installNative();
    if (ok) toast.success("App instalado! Agora ative as notificações.");
  };

  const isGranted = permission === "granted" && !!token;
  const isDenied = permission === "denied";

  // ---------- iOS not installed yet ----------
  if (platform === "ios" && !standalone) {
    return (
      <Card status="info" icon={<Bell className="h-5 w-5 text-primary" />}>
        <p className="text-sm font-bold">Ative as notificações no iPhone</p>
        <p className="text-xs text-muted-foreground">
          Para receber alertas no iPhone (iOS 16.4+), você precisa primeiro adicionar o app à tela inicial.
        </p>
        <ol className="mt-3 space-y-2 text-xs">
          <Step n={1} icon={<Share className="h-3.5 w-3.5" />} text="Toque no botão Compartilhar do Safari" />
          <Step n={2} icon={<Plus className="h-3.5 w-3.5" />} text='Escolha "Adicionar à Tela de Início"' />
          <Step n={3} icon={<Bell className="h-3.5 w-3.5" />} text="Abra o app pela tela inicial e ative as notificações" />
        </ol>
      </Card>
    );
  }

  // ---------- iOS too old ----------
  if (pushCheck.reason === "ios-too-old") {
    return (
      <Card status="warn" icon={<AlertCircle className="h-5 w-5 text-amber-600" />}>
        <p className="text-sm font-bold">iOS desatualizado</p>
        <p className="text-xs text-muted-foreground">
          Notificações exigem iOS 16.4 ou superior. Atualize seu iPhone para receber alertas.
        </p>
      </Card>
    );
  }
  // ---------- Browser unsupported ----------
  if (pushCheck.reason === "browser-unsupported") {
    return (
      <Card status="warn" icon={<AlertCircle className="h-5 w-5 text-muted-foreground" />}>
        <p className="text-sm font-bold">Navegador sem suporte</p>
        <p className="text-xs text-muted-foreground">
          Use Chrome (Android) ou Safari (iPhone) para receber notificações.
        </p>
      </Card>
    );
  }

  // ---------- Android not installed: optionally offer install ----------
  const androidShouldOfferInstall = platform === "android" && !standalone && hasNativePrompt;

  return (
    <Card
      status={isGranted ? "ok" : isDenied ? "error" : "info"}
      icon={
        isGranted ? (
          <BellRing className="h-5 w-5 text-green-600" />
        ) : isDenied ? (
          <AlertCircle className="h-5 w-5 text-red-500" />
        ) : (
          <Bell className="h-5 w-5 text-primary" />
        )
      }
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Notificações Push</p>
          <p className="text-xs text-muted-foreground">
            {isGranted
              ? "Ativadas neste dispositivo"
              : isDenied
              ? "Bloqueadas — libere nas configurações do navegador"
              : "Receba alertas em tempo real"}
          </p>
        </div>
        {isGranted && <Check className="h-5 w-5 text-green-600" />}
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-destructive/10 px-3 py-2">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {androidShouldOfferInstall && !isGranted && (
        <button
          onClick={handleInstallAndroid}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-bold active:scale-[0.97]"
        >
          <Download className="h-4 w-4" />
          Instalar app primeiro
        </button>
      )}

      {!isGranted && !isDenied && (
        <button
          onClick={handleEnable}
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.97] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ativando...
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" />
              Ativar notificações
            </>
          )}
        </button>
      )}
    </Card>
  );
};

const Card = ({
  children,
  status,
  icon,
}: {
  children: React.ReactNode;
  status: "ok" | "info" | "warn" | "error";
  icon: React.ReactNode;
}) => {
  const bg =
    status === "ok"
      ? "bg-green-100"
      : status === "error"
      ? "bg-red-100"
      : status === "warn"
      ? "bg-amber-100"
      : "bg-primary/10";
  return (
    <div className="rounded-2xl border bg-card p-5 space-y-2">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>{icon}</div>
        <div className="flex-1 space-y-1">{children}</div>
      </div>
    </div>
  );
};

const Step = ({ n, icon, text }: { n: number; icon: React.ReactNode; text: string }) => (
  <li className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
      {n}
    </span>
    <span className="flex items-center gap-1.5 text-foreground">
      {icon} {text}
    </span>
  </li>
);

export default PushSetupCard;
