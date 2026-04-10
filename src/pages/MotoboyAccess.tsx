import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bike, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MotoboyAccess = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem("motoboy_id");
    const savedName = localStorage.getItem("motoboy_name");
    if (savedId && savedName) {
      navigate("/motoboy", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!phone.trim() || !code.trim()) {
      setError("Preencha todos os campos");
      return;
    }

    setLoading(true);
    setError("");

    const { data } = await supabase
      .from("motoboys")
      .select("*")
      .eq("phone", phone.trim())
      .maybeSingle();

    setLoading(false);

    if (!data) {
      setError("Telefone não cadastrado");
      return;
    }

    if ((data as any).access_code !== code.trim()) {
      setError("Código de acesso incorreto");
      return;
    }

    localStorage.setItem("motoboy_id", data.id);
    localStorage.setItem("motoboy_name", data.name);
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
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bike className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold">Entrar como Motoboy</h2>
            <p className="text-sm text-muted-foreground">
              Use seu telefone e código de acesso
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Telefone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                placeholder="5535999999999"
                className="mt-1 w-full rounded-xl border bg-card py-3.5 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Código de acesso</label>
              <input
                type="password"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(""); }}
                placeholder="Seu código pessoal"
                className="mt-1 w-full rounded-xl border bg-card py-3.5 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {error && (
              <p className="text-center text-sm font-semibold text-destructive">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={!phone.trim() || !code.trim() || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENTRAR"}
            </button>

            <button
              onClick={() => navigate("/cadastro-motoboy")}
              className="w-full text-center text-sm font-semibold text-primary hover:underline"
            >
              Ainda não tem conta? Cadastre-se aqui
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MotoboyAccess;
