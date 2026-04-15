import { useState } from "react";
import { Bell, BellRing, Check, AlertCircle, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/useFCMNotifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  referenceId: string;
  userId?: string;
}

const NotificationPermissionCard = ({ referenceId, userId }: Props) => {
  const { supported, permission, token, loading, error, enableNotifications } = usePushNotifications({ referenceId, userId });
  const [testSending, setTestSending] = useState(false);

  const handleEnable = async () => {
    const t = await enableNotifications();
    if (t) toast.success("Notificações ativadas com sucesso!");
  };

  const handleTestNotification = async () => {
    if (!token) return;
    setTestSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-fcm", {
        body: {
          token,
          title: "🛵 Teste ChamaMoto",
          body: "Suas notificações push estão funcionando!",
          data: { link: "/" },
        },
      });
      if (error) throw error;
      toast.success("Notificação de teste enviada!");
    } catch (err: any) {
      toast.error("Erro ao enviar teste: " + (err.message || "Tente novamente"));
    } finally {
      setTestSending(false);
    }
  };

  if (!supported) {
    return (
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold">Notificações Push</p>
            <p className="text-xs text-muted-foreground">Não suportado neste navegador</p>
          </div>
        </div>
      </div>
    );
  }

  const isGranted = permission === "granted" && token;
  const isDenied = permission === "denied";

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          isGranted ? "bg-green-100" : isDenied ? "bg-red-100" : "bg-primary/10"
        }`}>
          {isGranted ? (
            <BellRing className="h-5 w-5 text-green-600" />
          ) : isDenied ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <Bell className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">Notificações Push</p>
          <p className="text-xs text-muted-foreground">
            {isGranted ? "Ativadas ✅" : isDenied ? "Bloqueadas pelo navegador" : "Receba alertas de pedidos em tempo real"}
          </p>
        </div>
        {isGranted && <Check className="h-5 w-5 text-green-600" />}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {isDenied && (
        <div className="rounded-lg bg-muted px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Permissão negada. Acesse as configurações do navegador para permitir notificações deste site.
          </p>
        </div>
      )}

      {!isGranted && !isDenied && (
        <button
          onClick={handleEnable}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.97] disabled:opacity-50 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Ativando...
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" />
              Ativar Notificações
            </>
          )}
        </button>
      )}

      {isGranted && (
        <button
          onClick={handleTestNotification}
          disabled={testSending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-bold active:scale-[0.97] disabled:opacity-50 transition-all"
        >
          {testSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <BellRing className="h-4 w-4" />
              Enviar Notificação de Teste
            </>
          )}
        </button>
      )}

      {isGranted && token && (
        <p className="text-[10px] text-muted-foreground break-all">
          Token: {token.slice(0, 20)}...{token.slice(-10)}
        </p>
      )}
    </div>
  );
};

export default NotificationPermissionCard;
