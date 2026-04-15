import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, Edit, Trash2, Eye, Package, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminPharmacies = () => {
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [managingProducts, setManagingProducts] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", owner_name: "", cnpj: "", phone: "", whatsapp: "", email: "",
    address: "", address_number: "", complement: "", neighborhood: "", zip_code: "",
    city_id: "", short_description: "", full_description: "",
    opening_time: "08:00", closing_time: "22:00", sunday_open: false,
    delivery_fee: "0", delivery_radius_km: "10", estimated_delivery_time: "30",
    accepts_pickup: false, own_delivery: false, status: "active",
  });

  // Product management
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [productForm, setProductForm] = useState<any>(null);

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") !== "true") {
      navigate("/login", { replace: true });
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    const [p, c] = await Promise.all([
      supabase.from("pharmacies").select("*").order("name"),
      supabase.from("cities").select("*").order("name"),
    ]);
    setPharmacies(p.data || []);
    setCities(c.data || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let list = pharmacies;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(s) || (p.neighborhood || "").toLowerCase().includes(s));
    }
    if (filterStatus) list = list.filter((p) => p.status === filterStatus);
    return list;
  }, [pharmacies, search, filterStatus]);

  const resetForm = () => {
    setForm({
      name: "", owner_name: "", cnpj: "", phone: "", whatsapp: "", email: "",
      address: "", address_number: "", complement: "", neighborhood: "", zip_code: "",
      city_id: cities[0]?.id || "", short_description: "", full_description: "",
      opening_time: "08:00", closing_time: "22:00", sunday_open: false,
      delivery_fee: "0", delivery_radius_km: "10", estimated_delivery_time: "30",
      accepts_pickup: false, own_delivery: false, status: "active",
    });
    setEditingId(null);
  };

  const openEdit = (p: any) => {
    setForm({
      name: p.name || "", owner_name: p.owner_name || "", cnpj: p.cnpj || "",
      phone: p.phone || "", whatsapp: p.whatsapp || "", email: p.email || "",
      address: p.address || "", address_number: p.address_number || "",
      complement: p.complement || "", neighborhood: p.neighborhood || "", zip_code: p.zip_code || "",
      city_id: p.city_id || "", short_description: p.short_description || "",
      full_description: p.full_description || "",
      opening_time: p.opening_time?.slice(0, 5) || "08:00",
      closing_time: p.closing_time?.slice(0, 5) || "22:00",
      sunday_open: p.sunday_open || false,
      delivery_fee: String(p.delivery_fee || 0),
      delivery_radius_km: String(p.delivery_radius_km || 10),
      estimated_delivery_time: String(p.estimated_delivery_time || 30),
      accepts_pickup: p.accepts_pickup || false, own_delivery: p.own_delivery || false,
      status: p.status || "active",
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!form.phone.trim()) { toast.error("Telefone é obrigatório"); return; }

    const payload = {
      ...form,
      delivery_fee: parseFloat(form.delivery_fee) || 0,
      delivery_radius_km: parseFloat(form.delivery_radius_km) || 10,
      estimated_delivery_time: parseInt(form.estimated_delivery_time) || 30,
      city_id: form.city_id || null,
    };

    if (editingId) {
      const { error } = await supabase.from("pharmacies").update(payload as any).eq("id", editingId);
      if (error) { toast.error("Erro: " + error.message); return; }
      toast.success("Farmácia atualizada!");
    } else {
      const { error } = await supabase.from("pharmacies").insert(payload as any);
      if (error) { toast.error("Erro: " + error.message); return; }
      toast.success("Farmácia cadastrada!");
    }
    setShowForm(false);
    resetForm();
    fetchData();
  };

  const toggleStatus = async (p: any) => {
    const newStatus = p.status === "active" ? "inactive" : "active";
    await supabase.from("pharmacies").update({ status: newStatus } as any).eq("id", p.id);
    toast.success(newStatus === "active" ? "Farmácia ativada" : "Farmácia desativada");
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("pharmacies").delete().eq("id", id);
    toast.success("Farmácia removida");
    setDeleting(null);
    fetchData();
  };

  // Product management functions
  const loadProducts = async (pharmacyId: string) => {
    const [cats, prods] = await Promise.all([
      supabase.from("pharmacy_categories").select("*").eq("pharmacy_id", pharmacyId).order("sort_order"),
      supabase.from("pharmacy_products").select("*").eq("pharmacy_id", pharmacyId).order("name"),
    ]);
    setCategories(cats.data || []);
    setProducts(prods.data || []);
  };

  const addCategory = async () => {
    if (!newCatName.trim() || !managingProducts) return;
    await supabase.from("pharmacy_categories").insert({ pharmacy_id: managingProducts, name: newCatName.trim() } as any);
    setNewCatName("");
    toast.success("Categoria adicionada");
    loadProducts(managingProducts);
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("pharmacy_categories").delete().eq("id", id);
    toast.success("Categoria removida");
    if (managingProducts) loadProducts(managingProducts);
  };

  const saveProduct = async () => {
    if (!productForm || !managingProducts) return;
    if (!productForm.name?.trim()) { toast.error("Nome do produto obrigatório"); return; }
    if (!productForm.price || productForm.price <= 0) { toast.error("Preço inválido"); return; }

    const payload = {
      pharmacy_id: managingProducts,
      name: productForm.name,
      description: productForm.description || "",
      price: parseFloat(productForm.price),
      category_id: productForm.category_id || null,
      internal_code: productForm.internal_code || "",
      active: productForm.active !== false,
    };

    if (productForm.id) {
      await supabase.from("pharmacy_products").update(payload as any).eq("id", productForm.id);
      toast.success("Produto atualizado");
    } else {
      await supabase.from("pharmacy_products").insert(payload as any);
      toast.success("Produto adicionado");
    }
    setProductForm(null);
    loadProducts(managingProducts);
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("pharmacy_products").delete().eq("id", id);
    toast.success("Produto removido");
    if (managingProducts) loadProducts(managingProducts);
  };

  const InputField = ({ label, value, onChange, placeholder = "", type = "text", required = false }: any) => (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-xl border bg-card py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );

  const CheckboxField = ({ label, checked, onChange }: any) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input accent-primary" />
      <span className="text-sm">{label}</span>
    </label>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Product management view
  if (managingProducts) {
    const pharm = pharmacies.find((p) => p.id === managingProducts);
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
          <button onClick={() => { setManagingProducts(null); setProductForm(null); }} className="rounded-full p-1.5 active:scale-90 hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Produtos</h1>
            <p className="text-xs text-muted-foreground">{pharm?.name}</p>
          </div>
        </header>
        <main className="flex-1 px-4 py-4 space-y-4 overflow-y-auto pb-6">
          {/* Categories */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase text-muted-foreground">Categorias</h3>
            <div className="flex gap-2">
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nova categoria"
                className="flex-1 rounded-lg border bg-card px-3 py-2 text-sm" />
              <button onClick={addCategory} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground active:scale-[0.97]">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1">
                  <span className="text-xs font-medium">{c.name}</span>
                  <button onClick={() => deleteCategory(c.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add/Edit product form */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase text-muted-foreground">Produtos</h3>
              <button onClick={() => setProductForm({ name: "", description: "", price: "", category_id: "", internal_code: "", active: true })}
                className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground active:scale-[0.97]">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </button>
            </div>
          </div>

          {productForm && (
            <div className="rounded-xl border bg-card p-4 space-y-3 animate-fade-in">
              <h4 className="text-sm font-bold">{productForm.id ? "Editar" : "Novo"} Produto</h4>
              <InputField label="Nome" value={productForm.name} onChange={(v: string) => setProductForm({ ...productForm, name: v })} required />
              <InputField label="Descrição" value={productForm.description} onChange={(v: string) => setProductForm({ ...productForm, description: v })} />
              <InputField label="Preço" value={productForm.price} onChange={(v: string) => setProductForm({ ...productForm, price: v })} type="number" required />
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Categoria</label>
                <select value={productForm.category_id || ""} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                  className="mt-1 w-full rounded-xl border bg-card py-3 px-4 text-sm">
                  <option value="">Sem categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <InputField label="Código interno" value={productForm.internal_code} onChange={(v: string) => setProductForm({ ...productForm, internal_code: v })} />
              <CheckboxField label="Ativo" checked={productForm.active} onChange={(v: boolean) => setProductForm({ ...productForm, active: v })} />
              <div className="flex gap-2">
                <button onClick={() => setProductForm(null)} className="flex-1 rounded-xl border py-3 text-sm font-bold text-muted-foreground">Cancelar</button>
                <button onClick={saveProduct} className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground active:scale-[0.97]">Salvar</button>
              </div>
            </div>
          )}

          {/* Product list */}
          {products.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Package className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum produto cadastrado</p>
            </div>
          ) : (
            products.map((p) => {
              const cat = categories.find((c) => c.id === p.category_id);
              return (
                <div key={p.id} className="rounded-xl border bg-card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate">{p.name}</p>
                      {!p.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Inativo</span>}
                    </div>
                    {cat && <p className="text-[10px] text-muted-foreground">{cat.name}</p>}
                    <p className="text-sm font-bold text-primary">R$ {Number(p.price).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setProductForm({ ...p, price: String(p.price) })} className="p-2 rounded-lg hover:bg-secondary">
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>
    );
  }

  // Pharmacy form
  if (showForm) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
          <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded-full p-1.5 active:scale-90 hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">{editingId ? "Editar" : "Nova"} Farmácia</h1>
        </header>
        <main className="flex-1 px-4 py-4 space-y-4 overflow-y-auto pb-6">
          <h3 className="text-xs font-bold uppercase text-muted-foreground">Dados da Farmácia</h3>
          <InputField label="Nome" value={form.name} onChange={(v: string) => setForm({ ...form, name: v })} required />
          <InputField label="Responsável" value={form.owner_name} onChange={(v: string) => setForm({ ...form, owner_name: v })} />
          <InputField label="CNPJ" value={form.cnpj} onChange={(v: string) => setForm({ ...form, cnpj: v })} placeholder="00.000.000/0000-00" />
          <InputField label="Telefone" value={form.phone} onChange={(v: string) => setForm({ ...form, phone: v })} required type="tel" />
          <InputField label="WhatsApp" value={form.whatsapp} onChange={(v: string) => setForm({ ...form, whatsapp: v })} type="tel" />
          <InputField label="E-mail" value={form.email} onChange={(v: string) => setForm({ ...form, email: v })} type="email" />

          <h3 className="text-xs font-bold uppercase text-muted-foreground pt-2">Endereço</h3>
          <InputField label="CEP" value={form.zip_code} onChange={(v: string) => setForm({ ...form, zip_code: v })} />
          <InputField label="Rua" value={form.address} onChange={(v: string) => setForm({ ...form, address: v })} />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Número" value={form.address_number} onChange={(v: string) => setForm({ ...form, address_number: v })} />
            <InputField label="Complemento" value={form.complement} onChange={(v: string) => setForm({ ...form, complement: v })} />
          </div>
          <InputField label="Bairro" value={form.neighborhood} onChange={(v: string) => setForm({ ...form, neighborhood: v })} />
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Cidade</label>
            <select value={form.city_id} onChange={(e) => setForm({ ...form, city_id: e.target.value })}
              className="mt-1 w-full rounded-xl border bg-card py-3 px-4 text-sm">
              <option value="">Selecionar cidade</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.state}</option>)}
            </select>
          </div>

          <h3 className="text-xs font-bold uppercase text-muted-foreground pt-2">Informações</h3>
          <InputField label="Descrição curta" value={form.short_description} onChange={(v: string) => setForm({ ...form, short_description: v })} />
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Descrição completa</label>
            <textarea value={form.full_description} onChange={(e) => setForm({ ...form, full_description: e.target.value })}
              rows={3} className="mt-1 w-full rounded-xl border bg-card py-3 px-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <h3 className="text-xs font-bold uppercase text-muted-foreground pt-2">Horários e Entrega</h3>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Abertura" value={form.opening_time} onChange={(v: string) => setForm({ ...form, opening_time: v })} type="time" />
            <InputField label="Fechamento" value={form.closing_time} onChange={(v: string) => setForm({ ...form, closing_time: v })} type="time" />
          </div>
          <CheckboxField label="Funciona aos domingos" checked={form.sunday_open} onChange={(v: boolean) => setForm({ ...form, sunday_open: v })} />
          <CheckboxField label="Entrega própria" checked={form.own_delivery} onChange={(v: boolean) => setForm({ ...form, own_delivery: v })} />
          <CheckboxField label="Aceita retirada" checked={form.accepts_pickup} onChange={(v: boolean) => setForm({ ...form, accepts_pickup: v })} />
          <InputField label="Taxa de entrega (R$)" value={form.delivery_fee} onChange={(v: string) => setForm({ ...form, delivery_fee: v })} type="number" />
          <InputField label="Raio de atendimento (km)" value={form.delivery_radius_km} onChange={(v: string) => setForm({ ...form, delivery_radius_km: v })} type="number" />
          <InputField label="Tempo médio de entrega (min)" value={form.estimated_delivery_time} onChange={(v: string) => setForm({ ...form, estimated_delivery_time: v })} type="number" />

          <h3 className="text-xs font-bold uppercase text-muted-foreground pt-2">Status</h3>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full rounded-xl border bg-card py-3 px-4 text-sm">
            <option value="active">Ativa</option>
            <option value="inactive">Inativa</option>
            <option value="pending">Pendente</option>
          </select>

          <button onClick={handleSave}
            className="w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg active:scale-[0.97] transition-transform">
            {editingId ? "Salvar Alterações" : "Cadastrar Farmácia"}
          </button>
        </main>
      </div>
    );
  }

  // Main list
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
        <button onClick={() => navigate("/admin")} className="rounded-full p-1.5 active:scale-90 hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">💊 Farmácias</h1>
          <p className="text-xs text-muted-foreground">{pharmacies.length} cadastradas</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground active:scale-[0.97]">
          <Plus className="h-4 w-4" /> Nova
        </button>
      </header>

      <div className="px-4 pt-3 space-y-2">
        <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar farmácia..."
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none" />
        </div>
        <div className="flex gap-2">
          {["", "active", "inactive", "pending"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-card border text-muted-foreground"}`}>
              {s === "" ? "Todos" : s === "active" ? "Ativas" : s === "inactive" ? "Inativas" : "Pendentes"}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 py-3 space-y-3 overflow-y-auto pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="text-5xl mb-3">💊</span>
            <p className="text-sm text-muted-foreground">Nenhuma farmácia encontrada</p>
          </div>
        ) : (
          filtered.map((p) => {
            const city = cities.find((c) => c.id === p.city_id);
            return (
              <div key={p.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">💊</div>
                    <div>
                      <p className="text-sm font-bold">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.neighborhood || "—"} • {city?.name || "—"} • {p.phone}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    p.status === "active" ? "bg-green-100 text-green-700" :
                    p.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {p.status === "active" ? "Ativa" : p.status === "pending" ? "Pendente" : "Inativa"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => openEdit(p)} className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] font-medium active:scale-[0.97]">
                    <Edit className="h-3 w-3" /> Editar
                  </button>
                  <button onClick={() => { setManagingProducts(p.id); loadProducts(p.id); }}
                    className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] font-medium active:scale-[0.97]">
                    <Package className="h-3 w-3" /> Produtos
                  </button>
                  <button onClick={() => toggleStatus(p)}
                    className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] font-medium active:scale-[0.97]">
                    {p.status === "active" ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                    {p.status === "active" ? "Desativar" : "Ativar"}
                  </button>
                  <button onClick={() => setDeleting(p.id)}
                    className="flex items-center gap-1 rounded-lg bg-destructive/10 px-2.5 py-1.5 text-[11px] font-medium text-destructive active:scale-[0.97]">
                    <Trash2 className="h-3 w-3" /> Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-center">⚠️ Excluir farmácia?</h3>
            <p className="text-sm text-muted-foreground text-center">Essa ação não pode ser desfeita. Todos os produtos serão removidos.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 rounded-xl border py-3 text-sm font-bold text-muted-foreground">Cancelar</button>
              <button onClick={() => handleDelete(deleting)} className="flex-1 rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPharmacies;
