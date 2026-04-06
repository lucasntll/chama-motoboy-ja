import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ADMIN_USER = "admin";
const ADMIN_PASS = "123admin";

const Login = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !password) return;

    setLoading(true);

    setTimeout(() => {
      if (user === ADMIN_USER && password === ADMIN_PASS) {
        sessionStorage.setItem("admin_auth", "true");
        navigate("/admin");
      } else {
        toast({
          title: "Erro ao entrar",
          description: "Usuário ou senha incorretos",
          variant: "destructive",
        });
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate("/")} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Painel Admin</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Shield className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold">Acesso Admin</h2>
            <p className="text-sm text-muted-foreground">
              Área restrita do administrador
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Usuário
              </label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="admin"
                className="mt-1 w-full rounded-xl border bg-card py-3.5 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border bg-card py-3.5 px-4 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !user || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground transition-all active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENTRAR"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
