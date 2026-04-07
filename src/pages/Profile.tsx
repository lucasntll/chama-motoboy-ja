import { useState, useEffect } from "react";
import { Camera, Save } from "lucide-react";
import { DEFAULT_PROFILE, type UserProfile } from "@/lib/data";
import { useClientData } from "@/hooks/useClientData";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { toast } = useToast();
  const { data: clientData, saveAfterOrder } = useClientData();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    const stored = localStorage.getItem("user_profile");
    const parsed = stored ? JSON.parse(stored) : DEFAULT_PROFILE;
    // Merge clientData into profile if available
    if (clientData.name && !parsed.name) parsed.name = clientData.name;
    if (clientData.phone && !parsed.phone) parsed.phone = clientData.phone;
    setProfile(parsed);
  }, []);

  const handleSave = () => {
    localStorage.setItem("user_profile", JSON.stringify(profile));
    // Sync to clientData system
    localStorage.setItem("profile_name", profile.name);
    localStorage.setItem("profile_phone", profile.phone);
    const clientRaw = localStorage.getItem("client_data");
    if (clientRaw) {
      try {
        const cd = JSON.parse(clientRaw);
        cd.name = profile.name;
        cd.phone = profile.phone;
        localStorage.setItem("client_data", JSON.stringify(cd));
      } catch {}
    } else {
      localStorage.setItem("client_data", JSON.stringify({ name: profile.name, phone: profile.phone, addresses: [] }));
    }
    setEditing(false);
    toast({ title: "Perfil atualizado!", description: "Suas informações foram salvas." });
  };

  const initials = profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="border-b bg-card px-5 py-4">
        <h1 className="text-lg font-bold">Meu Perfil</h1>
      </header>

      <main className="flex-1 px-5 py-8">
        <div className="flex flex-col items-center animate-fade-in-up">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-2xl">
              {initials}
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-card border shadow-sm active:scale-90 transition-transform">
              <Camera className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {!editing ? (
            <div className="mt-6 w-full max-w-sm space-y-4 text-center">
              <div>
                <p className="text-xl font-bold">{profile.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{profile.phone}</p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow transition-shadow hover:shadow-lg active:scale-[0.97]"
              >
                Editar Perfil
              </button>
            </div>
          ) : (
            <div className="mt-6 w-full max-w-sm space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Telefone</label>
                <input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                onClick={handleSave}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow transition-shadow hover:shadow-lg active:scale-[0.97]"
              >
                <Save className="h-4 w-4" />
                Salvar
              </button>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
