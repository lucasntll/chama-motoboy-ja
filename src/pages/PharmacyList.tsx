import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Clock, MapPin, Phone, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";

const PharmacyList = () => {
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterNeighborhood, setFilterNeighborhood] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const cityId = localStorage.getItem("selected_city_id") || null;

  useEffect(() => {
    loadPharmacies();
  }, []);

  const loadPharmacies = async () => {
    let query = supabase
      .from("pharmacies")
      .select("*")
      .eq("status", "active")
      .order("name");

    if (cityId) query = query.eq("city_id", cityId);

    const { data } = await query;
    setPharmacies(data || []);
    setLoading(false);
  };

  const isOpen = (p: any) => {
    if (!p.opening_time || !p.closing_time) return true;
    const now = new Date();
    const day = now.getDay();
    if (day === 0 && !p.sunday_open) return false;
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return hhmm >= p.opening_time && hhmm <= p.closing_time;
  };

  const neighborhoods = useMemo(() => {
    const set = new Set(pharmacies.map((p) => p.neighborhood).filter(Boolean));
    return Array.from(set).sort();
  }, [pharmacies]);

  const filtered = useMemo(() => {
    let list = pharmacies;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(s));
    }
    if (filterNeighborhood) {
      list = list.filter((p) => p.neighborhood === filterNeighborhood);
    }
    if (filterOpen) {
      list = list.filter((p) => isOpen(p));
    }
    return list;
  }, [pharmacies, search, filterNeighborhood, filterOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold">💊 Farmácias</h1>
          <p className="text-xs text-muted-foreground">{filtered.length} disponíveis</p>
        </div>
      </header>

      <div className="px-4 pt-3 space-y-2">
        <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar farmácia..."
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              showFilters || filterNeighborhood || filterOpen
                ? "bg-primary text-primary-foreground"
                : "bg-card border text-muted-foreground"
            }`}
          >
            <Filter className="h-3 w-3" />
            Filtros
          </button>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterOpen ? "bg-primary text-primary-foreground" : "bg-card border text-muted-foreground"
            }`}
          >
            🟢 Aberto agora
          </button>
        </div>

        {showFilters && neighborhoods.length > 0 && (
          <div className="flex flex-wrap gap-1.5 animate-fade-in">
            <button
              onClick={() => setFilterNeighborhood("")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                !filterNeighborhood ? "bg-primary text-primary-foreground" : "bg-card border text-muted-foreground"
              }`}
            >
              Todos
            </button>
            {neighborhoods.map((n) => (
              <button
                key={n}
                onClick={() => setFilterNeighborhood(n === filterNeighborhood ? "" : n)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  filterNeighborhood === n ? "bg-primary text-primary-foreground" : "bg-card border text-muted-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      <main className="flex-1 px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3 text-sm text-muted-foreground">Carregando farmácias...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="text-5xl mb-3">💊</span>
            <p className="text-sm font-semibold text-foreground">Nenhuma farmácia encontrada</p>
            <p className="text-xs text-muted-foreground mt-1">Tente ajustar os filtros</p>
          </div>
        ) : (
          filtered.map((p) => {
            const open = isOpen(p);
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/farmacia/${p.id}`)}
                className="w-full rounded-2xl border bg-card p-4 text-left transition-all active:scale-[0.98] hover:shadow-md space-y-2"
              >
                <div className="flex items-start gap-3">
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.name} className="h-14 w-14 rounded-xl object-cover border" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-2xl">💊</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold truncate">{p.name}</p>
                      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}>
                        {open ? "Aberto" : "Fechado"}
                      </span>
                    </div>
                    {p.short_description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.short_description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      {p.neighborhood && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {p.neighborhood}
                        </span>
                      )}
                      {p.opening_time && p.closing_time && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" /> {p.opening_time.slice(0, 5)} - {p.closing_time.slice(0, 5)}
                        </span>
                      )}
                      {p.estimated_delivery_time && (
                        <span className="text-[11px] text-muted-foreground">🕐 ~{p.estimated_delivery_time}min</span>
                      )}
                    </div>
                    {(p.delivery_fee !== null && p.delivery_fee > 0) && (
                      <p className="text-[11px] text-primary font-semibold mt-1">Taxa: R${Number(p.delivery_fee).toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default PharmacyList;
