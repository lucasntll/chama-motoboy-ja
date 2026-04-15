import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Store, Search, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEFAULT_ICONS = ["🍔", "💊", "🛒", "🍺", "🥖", "🥩", "🏪", "📄", "🧩", "☕", "🍕", "🛍️", "🏠", "📦"];
const DEFAULT_COLORS = ["#F59E0B", "#EF4444", "#10B981", "#3B82F6", "#D97706", "#DC2626", "#8B5CF6", "#6B7280", "#14B8A6", "#EC4899"];

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  active: boolean;
  display_order: number;
}

interface Establishment {
  id: string;
  name: string;
  category_id: string | null;
  category: string;
  phone: string;
  neighborhood: string;
  status: string;
  is_open: boolean;
  city_id: string;
  address: string;
  owner_name: string;
  short_description: string;
  open_time: string | null;
  close_time: string | null;
  sunday_open: boolean;
  delivery_fee: number;
  estimated_delivery_time: number;
  whatsapp: string;
  email: string;
  logo_url: string;
  banner_url: string;
}

const AdminCategories = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"categories" | "establishments">("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Category form
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: "", slug: "", icon: "🏪", color: "#10B981", description: "", active: true, display_order: 0 });

  // Establishment form
  const [editingEst, setEditingEst] = useState<Establishment | null>(null);
  const [showEstForm, setShowEstForm] = useState(false);
  const [estForm, setEstForm] = useState({
    name: "", category_id: "", phone: "", whatsapp: "", email: "", owner_name: "",
    address: "", neighborhood: "", city_id: "", short_description: "",
    open_time: "08:00", close_time: "22:00", sunday_open: false,
    delivery_fee: 0, estimated_delivery_time: 30, status: "active",
    logo_url: "", banner_url: "",
  });

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") !== "true") {
      navigate("/login", { replace: true });
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    const [c, e, ci] = await Promise.all([
      supabase.from("categories").select("*").order("display_order"),
      supabase.from("establishments").select("*").order("name"),
      supabase.from("cities").select("*").order("name"),
    ]);
    setCategories((c.data || []) as Category[]);
    setEstablishments((e.data || []) as Establishment[]);
    setCities(ci.data || []);
    setLoading(false);
  };

  // === CATEGORY CRUD ===
  const openCatForm = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ name: cat.name, slug: cat.slug, icon: cat.icon, color: cat.color, description: cat.description || "", active: cat.active, display_order: cat.display_order });
    } else {
      setEditingCat(null);
      setCatForm({ name: "", slug: "", icon: "🏪", color: "#10B981", description: "", active: true, display_order: categories.length + 1 });
    }
  };

  const closeCatForm = () => { setEditingCat(null); setCatForm({ name: "", slug: "", icon: "🏪", color: "#10B981", description: "", active: true, display_order: 0 }); };

  const saveCat = async () => {
    if (!catForm.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const slug = catForm.slug || catForm.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = { ...catForm, slug };

    if (editingCat) {
      const { error } = await supabase.from("categories").update(payload as any).eq("id", editingCat.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Categoria atualizada!");
    } else {
      const { error } = await supabase.from("categories").insert(payload as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Categoria criada!");
    }
    closeCatForm();
    fetchData();
  };

  const deleteCat = async (id: string) => {
    if (!confirm("Excluir esta categoria?")) return;
    await supabase.from("categories").delete().eq("id", id);
    toast.success("Categoria excluída");
    fetchData();
  };

  const toggleCatActive = async (cat: Category) => {
    await supabase.from("categories").update({ active: !cat.active } as any).eq("id", cat.id);
    toast.success(cat.active ? "Categoria desativada" : "Categoria ativada");
    fetchData();
  };

  // === ESTABLISHMENT CRUD ===
  const openEstForm = (est?: Establishment) => {
    setShowEstForm(true);
    if (est) {
      setEditingEst(est);
      setEstForm({
        name: est.name, category_id: est.category_id || "", phone: est.phone || "", whatsapp: est.whatsapp || "",
        email: est.email || "", owner_name: est.owner_name || "", address: est.address || "",
        neighborhood: est.neighborhood || "", city_id: est.city_id || "",
        short_description: est.short_description || "", open_time: est.open_time?.slice(0, 5) || "08:00",
        close_time: est.close_time?.slice(0, 5) || "22:00", sunday_open: est.sunday_open || false,
        delivery_fee: est.delivery_fee || 0, estimated_delivery_time: est.estimated_delivery_time || 30,
        status: est.status || "active", logo_url: est.logo_url || "", banner_url: est.banner_url || "",
      });
    } else {
      setEditingEst(null);
      setEstForm({
        name: "", category_id: "", phone: "", whatsapp: "", email: "", owner_name: "",
        address: "", neighborhood: "", city_id: "", short_description: "",
        open_time: "08:00", close_time: "22:00", sunday_open: false,
        delivery_fee: 0, estimated_delivery_time: 30, status: "active",
        logo_url: "", banner_url: "",
      });
    }
  };

  const closeEstForm = () => { setShowEstForm(false); setEditingEst(null); };

  const saveEst = async () => {
    if (!estForm.name.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!estForm.category_id) { toast.error("Categoria é obrigatória"); return; }
    if (!estForm.city_id) { toast.error("Cidade é obrigatória"); return; }

    const cat = categories.find((c) => c.id === estForm.category_id);
    const payload: any = {
      ...estForm,
      category: cat?.name || "",
      category_id: estForm.category_id || null,
      delivery_fee: Number(estForm.delivery_fee) || 0,
      estimated_delivery_time: Number(estForm.estimated_delivery_time) || 30,
    };

    if (editingEst) {
      const { error } = await supabase.from("establishments").update(payload).eq("id", editingEst.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Estabelecimento atualizado!");
    } else {
      // Generate access code
      payload.access_code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const { error } = await supabase.from("establishments").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Estabelecimento criado!");
    }
    closeEstForm();
    fetchData();
  };

  const deleteEst = async (id: string) => {
    if (!confirm("Excluir este estabelecimento?")) return;
    await supabase.from("establishments").update({ status: "inactive" } as any).eq("id", id);
    toast.success("Estabelecimento desativado");
    fetchData();
  };

  const toggleEstStatus = async (est: Establishment) => {
    const newStatus = est.status === "active" ? "inactive" : "active";
    await supabase.from("establishments").update({ status: newStatus } as any).eq("id", est.id);
    toast.success(newStatus === "active" ? "Ativado" : "Desativado");
    fetchData();
  };

  const filteredEst = establishments.filter((e) => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat && e.category_id !== filterCat) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const showCatForm = editingCat !== null || catForm.name !== "";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate("/admin")} className="rounded-full p-1.5 active:scale-90 hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Categorias & Estabelecimentos</h1>
      </header>

      <div className="flex border-b px-4">
        <button
          onClick={() => setTab("categories")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "categories" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
        >
          Categorias
        </button>
        <button
          onClick={() => setTab("establishments")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "establishments" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
        >
          Estabelecimentos
        </button>
      </div>

      <main className="flex-1 px-4 py-3 space-y-3 overflow-y-auto pb-6">
        {/* === CATEGORIES TAB === */}
        {tab === "categories" && (
          <>
            <button onClick={() => openCatForm()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.97]">
              <Plus className="h-4 w-4" /> Nova Categoria
            </button>

            {/* Cat form modal */}
            {(editingCat !== null || catForm.name !== "") && (
              <div className="rounded-xl border bg-card p-4 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{editingCat ? "Editar" : "Nova"} Categoria</h3>
                  <button onClick={closeCatForm}><X className="h-4 w-4" /></button>
                </div>
                <input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Nome" className="w-full rounded-lg border px-3 py-2 text-sm" />
                <input value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} placeholder="Slug (auto)" className="w-full rounded-lg border px-3 py-2 text-sm" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ícone</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_ICONS.map((icon) => (
                      <button key={icon} onClick={() => setCatForm({ ...catForm, icon })} className={`text-xl p-1.5 rounded-lg ${catForm.icon === icon ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-secondary"}`}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Cor</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_COLORS.map((color) => (
                      <button key={color} onClick={() => setCatForm({ ...catForm, color })} className={`h-7 w-7 rounded-full border-2 ${catForm.color === color ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                <input type="number" value={catForm.display_order} onChange={(e) => setCatForm({ ...catForm, display_order: Number(e.target.value) })} placeholder="Ordem" className="w-full rounded-lg border px-3 py-2 text-sm" />
                <textarea value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} placeholder="Descrição" className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={catForm.active} onChange={(e) => setCatForm({ ...catForm, active: e.target.checked })} className="rounded" />
                  Ativa
                </label>
                <button onClick={saveCat} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.97]">
                  <Save className="h-4 w-4" /> Salvar
                </button>
              </div>
            )}

            {categories.map((cat) => (
              <div key={cat.id} className="rounded-xl border bg-card p-4 flex items-center gap-3">
                <span className="text-2xl" style={{ filter: cat.active ? "none" : "grayscale(1)" }}>{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate">{cat.name}</p>
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    {!cat.active && <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">inativa</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">/{cat.slug} • Ordem: {cat.display_order}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openCatForm(cat)} className="p-1.5 rounded-lg hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => toggleCatActive(cat)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                    {cat.active ? "🔴" : "🟢"}
                  </button>
                  <button onClick={() => deleteCat(cat.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* === ESTABLISHMENTS TAB === */}
        {tab === "establishments" && (
          <>
            <button onClick={() => openEstForm()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.97]">
              <Plus className="h-4 w-4" /> Novo Estabelecimento
            </button>

            <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full bg-transparent text-sm focus:outline-none" />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-lg border bg-card px-2 py-1.5 text-xs">
                <option value="">Todas categorias</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border bg-card px-2 py-1.5 text-xs">
                <option value="">Todos status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="pending">Pendente</option>
              </select>
            </div>

            {filteredEst.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Store className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum estabelecimento encontrado</p>
              </div>
            ) : (
              filteredEst.map((est) => {
                const cat = categories.find((c) => c.id === est.category_id);
                const city = cities.find((c: any) => c.id === est.city_id);
                return (
                  <div key={est.id} className="rounded-xl border bg-card p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <span className="text-xl">{cat?.icon || "🏪"}</span>
                        <div>
                          <p className="text-sm font-bold">{est.name}</p>
                          <p className="text-xs text-muted-foreground">{cat?.name || est.category} • {city?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{est.neighborhood || est.address}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        est.status === "active" ? "bg-green-100 text-green-700" : est.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"
                      }`}>
                        {est.status === "active" ? "Ativo" : est.status === "pending" ? "Pendente" : "Inativo"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEstForm(est)} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-secondary py-2 text-xs font-bold active:scale-[0.97]">
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                      <button onClick={() => toggleEstStatus(est)} className="flex items-center justify-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-bold active:scale-[0.97]">
                        {est.status === "active" ? "🔴" : "🟢"}
                      </button>
                      <button onClick={() => deleteEst(est.id)} className="flex items-center justify-center gap-1 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive active:scale-[0.97]">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Establishment form modal */}
            {showEstForm && (
              <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-4 px-4 overflow-y-auto pb-8">
                <div className="w-full max-w-lg rounded-2xl bg-card p-5 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold">{editingEst ? "Editar" : "Novo"} Estabelecimento</h3>
                    <button onClick={closeEstForm}><X className="h-5 w-5" /></button>
                  </div>

                  <select value={estForm.category_id} onChange={(e) => setEstForm({ ...estForm, category_id: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="">Selecionar categoria *</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>

                  <input value={estForm.name} onChange={(e) => setEstForm({ ...estForm, name: e.target.value })} placeholder="Nome do estabelecimento *" className="w-full rounded-lg border px-3 py-2 text-sm" />
                  <input value={estForm.owner_name} onChange={(e) => setEstForm({ ...estForm, owner_name: e.target.value })} placeholder="Nome do responsável" className="w-full rounded-lg border px-3 py-2 text-sm" />

                  <div className="grid grid-cols-2 gap-2">
                    <input value={estForm.phone} onChange={(e) => setEstForm({ ...estForm, phone: e.target.value })} placeholder="Telefone" className="rounded-lg border px-3 py-2 text-sm" />
                    <input value={estForm.whatsapp} onChange={(e) => setEstForm({ ...estForm, whatsapp: e.target.value })} placeholder="WhatsApp" className="rounded-lg border px-3 py-2 text-sm" />
                  </div>

                  <input value={estForm.email} onChange={(e) => setEstForm({ ...estForm, email: e.target.value })} placeholder="E-mail" className="w-full rounded-lg border px-3 py-2 text-sm" />

                  <input value={estForm.address} onChange={(e) => setEstForm({ ...estForm, address: e.target.value })} placeholder="Endereço" className="w-full rounded-lg border px-3 py-2 text-sm" />

                  <div className="grid grid-cols-2 gap-2">
                    <input value={estForm.neighborhood} onChange={(e) => setEstForm({ ...estForm, neighborhood: e.target.value })} placeholder="Bairro" className="rounded-lg border px-3 py-2 text-sm" />
                    <select value={estForm.city_id} onChange={(e) => setEstForm({ ...estForm, city_id: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
                      <option value="">Cidade *</option>
                      {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <input value={estForm.short_description} onChange={(e) => setEstForm({ ...estForm, short_description: e.target.value })} placeholder="Descrição curta" className="w-full rounded-lg border px-3 py-2 text-sm" />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-muted-foreground">Abertura</label>
                      <input type="time" value={estForm.open_time} onChange={(e) => setEstForm({ ...estForm, open_time: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">Fechamento</label>
                      <input type="time" value={estForm.close_time} onChange={(e) => setEstForm({ ...estForm, close_time: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-muted-foreground">Taxa entrega (R$)</label>
                      <input type="number" step="0.01" value={estForm.delivery_fee} onChange={(e) => setEstForm({ ...estForm, delivery_fee: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">Tempo entrega (min)</label>
                      <input type="number" value={estForm.estimated_delivery_time} onChange={(e) => setEstForm({ ...estForm, estimated_delivery_time: Number(e.target.value) })} className="w-full rounded-lg border px-3 py-2 text-sm" />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={estForm.sunday_open} onChange={(e) => setEstForm({ ...estForm, sunday_open: e.target.checked })} className="rounded" />
                    Funciona aos domingos
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <input value={estForm.logo_url} onChange={(e) => setEstForm({ ...estForm, logo_url: e.target.value })} placeholder="URL do logo" className="rounded-lg border px-3 py-2 text-sm" />
                    <input value={estForm.banner_url} onChange={(e) => setEstForm({ ...estForm, banner_url: e.target.value })} placeholder="URL do banner" className="rounded-lg border px-3 py-2 text-sm" />
                  </div>

                  <select value={estForm.status} onChange={(e) => setEstForm({ ...estForm, status: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="pending">Pendente</option>
                  </select>

                  <button onClick={saveEst} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.97]">
                    <Save className="h-4 w-4" /> Salvar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminCategories;
