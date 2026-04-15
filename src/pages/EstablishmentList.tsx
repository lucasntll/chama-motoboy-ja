import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Search, Clock, MapPin, Phone, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";

const EstablishmentList = () => {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterNeighborhood, setFilterNeighborhood] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const cityId = localStorage.getItem("selected_city_id") || null;

  useEffect(() => {
    loadData();
  }, [categorySlug]);

  const loadData = async () => {
    setLoading(true);

    // If slug is "remedio", redirect to pharmacy-specific page
    if (categorySlug === "remedio") {
      navigate("/farmacias", { replace: true });
      return;
    }

    // Load category
    const { data: cat } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", categorySlug)
      .eq("active", true)
      .maybeSingle();

    setCategory(cat);

    if (!cat) {
      setLoading(false);
      return;
    }

    // Load establishments for this category
    let query = supabase
      .from("establishments")
      .select("*")
      .eq("category_id", cat.id)
      .eq("status", "active")
      .order("name");

    if (cityId) query = query.eq("city_id", cityId);

    const { data } = await query;
    setEstablishments(data || []);
    setLoading(false);
  };

  const isOpen = (e: any) => {
    if (!e.open_time || !e.close_time) return true;
    const now = new Date();
    const day = now.getDay();
    if (day === 0 && !e.sunday_open) return false;
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return hhmm >= e.open_time && hhmm <= e.close_time;
  };

  const neighborhoods = useMemo(() => {
    const set = new Set(establishments.map((e) => e.neighborhood).filter(Boolean));
    return Array.from(set).sort();
  }, [establishments]);

  const filtered = useMemo(() => {
    let list = establishments;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(s));
    }
    if (filterNeighborhood) {
      list = list.filter((e) => e.neighborhood === filterNeighborhood);
    }
    if (filterOpen) {
      list = list.filter((e) => isOpen(e));
    }
    return list;
  }, [establishments, search, filterNeighborhood, filterOpen]);

  const emoji = category?.icon || "🏪";
  const title = category?.name || "Estabelecimentos";

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate(-1)} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold">{emoji} {title}</h1>
          <p className="text-xs text-muted-foreground">{filtered.length} disponíveis</p>
        </div>
      </header>

      <div className="px-4 pt-3 space-y-2">
        <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar ${title.toLowerCase()}...`}
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
            <p className="mt-3 text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : !category ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="text-5xl mb-3">🔍</span>
            <p className="text-sm font-semibold">Categoria não encontrada</p>
            <button onClick={() => navigate("/")} className="mt-3 text-sm text-primary underline">Voltar ao início</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="text-5xl mb-3">{emoji}</span>
            <p className="text-sm font-semibold text-foreground">Nenhum estabelecimento encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">Tente ajustar os filtros</p>
          </div>
        ) : (
          filtered.map((e) => {
            const open = isOpen(e);
            return (
              <button
                key={e.id}
                onClick={() => navigate(`/estabelecimento/${e.id}`)}
                className="w-full rounded-2xl border bg-card p-4 text-left transition-all active:scale-[0.98] hover:shadow-md space-y-2"
              >
                <div className="flex items-start gap-3">
                  {e.logo_url ? (
                    <img src={e.logo_url} alt={e.name} className="h-14 w-14 rounded-xl object-cover border" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-2xl">{emoji}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold truncate">{e.name}</p>
                      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}>
                        {open ? "Aberto" : "Fechado"}
                      </span>
                    </div>
                    {e.short_description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{e.short_description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      {e.neighborhood && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {e.neighborhood}
                        </span>
                      )}
                      {e.open_time && e.close_time && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" /> {String(e.open_time).slice(0, 5)} - {String(e.close_time).slice(0, 5)}
                        </span>
                      )}
                      {e.estimated_delivery_time && (
                        <span className="text-[11px] text-muted-foreground">🕐 ~{e.estimated_delivery_time}min</span>
                      )}
                    </div>
                    {e.delivery_fee > 0 && (
                      <p className="text-[11px] text-primary font-semibold mt-1">Taxa: R${Number(e.delivery_fee).toFixed(2)}</p>
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

export default EstablishmentList;
