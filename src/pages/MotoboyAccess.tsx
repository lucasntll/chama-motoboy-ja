import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bike, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ACCESS_CODE = "moto2026";

const MotoboyAccess = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [codeValid, setCodeValid] = useState(false);
  const [motoboys, setMotoboys] = useState<any[]>([]);
  const [loadingMotoboys, setLoadingMotoboys] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const savedId = localStorage.getItem("motoboy_id");
    const savedName = localStorage.getItem("motoboy_name");
    if (savedId && savedName) {
      navigate("/motoboy", { replace: true });
    }
  }, [navigate]);

  const handleCodeSubmit = async () => {
    if (code.trim().toLowerCase() !== ACCESS_CODE) {
      setError("Código inválido");
      return;
    }
    setError("");
    setCodeValid(true);
    setLoadingMotoboys(true);

    const { data } = await supabase
      .from("motoboys")
      .select("id, name, phone, vehicle")
      .order("name");

    setMotoboys(data || []);
    setLoadingMotoboys(false);
  };

  const selectMotoboy = (motoboy: any) => {
    localStorage.setItem("motoboy_id", motoboy.id);
    localStorage.setItem("motoboy_name", motoboy.name);
    navigate("/motoboy", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate("/")} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Área do Motoboy</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        {!codeValid ? (
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bike className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold">Entrar como Motoboy</h2>
              <p className="text-sm text-muted-foreground">
                Digite o código de acesso para entrar
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(""); }}
                placeholder="Código de acesso"
                className="w-full rounded-xl border bg-card py-3.5 px-4 text-center text-lg font-bold tracking-widest placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
              />
              {error && (
                <p className="text-center text-sm font-semibold text-destructive">{error}</p>
              )}
              <button
                onClick={handleCodeSubmit}
                disabled={!code.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground active:scale-[0.97] disabled:opacity-50"
              >
                ENTRAR
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-center">Quem é você?</h2>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Selecione seu nome para continuar
            </p>

            {loadingMotoboys ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : motoboys.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhum motoboy cadastrado no sistema
              </p>
            ) : (
              <div className="space-y-2">
                {motoboys.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => selectMotoboy(m)}
                    className="flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all active:scale-[0.98] hover:border-primary hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.phone} • {m.vehicle}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MotoboyAccess;
