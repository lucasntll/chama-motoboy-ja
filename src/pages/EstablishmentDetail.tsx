import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Clock, MapPin, ShoppingCart, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

const EstablishmentDetail = () => {
  const { establishmentId } = useParams();
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchProduct, setSearchProduct] = useState("");

  useEffect(() => {
    if (establishmentId) loadData();
  }, [establishmentId]);

  const loadData = async () => {
    const [est, cats, prods] = await Promise.all([
      supabase.from("establishments").select("*").eq("id", establishmentId).single(),
      supabase.from("establishment_categories").select("*").eq("establishment_id", establishmentId).eq("active", true).order("sort_order"),
      supabase.from("establishment_products").select("*").eq("establishment_id", establishmentId).eq("active", true).order("name"),
    ]);
    setEstablishment(est.data);
    setCategories(cats.data || []);
    setProducts(prods.data || []);
    setLoading(false);
  };

  const isOpen = () => {
    if (!establishment?.open_time || !establishment?.close_time) return true;
    const now = new Date();
    if (now.getDay() === 0 && !establishment.sunday_open) return false;
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return hhmm >= establishment.open_time && hhmm <= establishment.close_time;
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCat) list = list.filter((p) => p.category_id === selectedCat);
    if (searchProduct) {
      const s = searchProduct.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(s) || (p.description || "").toLowerCase().includes(s));
    }
    return list;
  }, [products, selectedCat, searchProduct]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) return prev.map((c) => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: product.id, name: product.name, price: Number(product.price), qty: 1 }];
    });
    toast.success(`${product.name} adicionado!`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter((c) => c.qty > 0)
    );
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const desc = cart.map((c) => `${c.qty}x ${c.name}`).join(", ");
    const estName = establishment?.name || "Estabelecimento";
    const catName = establishment?.category || "";
    localStorage.setItem("pharmacy_order", JSON.stringify({
      description: `${catName}: ${desc}`,
      purchaseLocation: `${estName} - ${establishment?.address || ""}`,
      productValue: cartTotal,
    }));
    navigate("/cliente/livre");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <p className="text-lg font-bold">Estabelecimento não encontrado</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-primary underline">Voltar</button>
      </div>
    );
  }

  const open = isOpen();
  const emoji = "🏪";

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {establishment.banner_url ? (
        <div className="relative h-40 bg-primary/10">
          <img src={establishment.banner_url} alt="" className="h-full w-full object-cover" />
          <button onClick={() => navigate(-1)} className="absolute left-3 top-3 rounded-full bg-card/80 p-2 backdrop-blur-sm active:scale-90">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <header className="flex items-center gap-3 bg-card px-4 py-3 border-b">
          <button onClick={() => navigate(-1)} className="rounded-full p-1.5 active:scale-90 transition-transform hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">{emoji} {establishment.name}</h1>
        </header>
      )}

      {/* Info */}
      <div className="px-4 py-4 space-y-3 border-b bg-card">
        <div className="flex items-start gap-3">
          {establishment.logo_url ? (
            <img src={establishment.logo_url} alt={establishment.name} className="h-16 w-16 rounded-xl object-cover border" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-3xl">{emoji}</div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{establishment.name}</h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}>
                {open ? "Aberto" : "Fechado"}
              </span>
            </div>
            {establishment.short_description && (
              <p className="text-xs text-muted-foreground mt-0.5">{establishment.short_description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {establishment.address && (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {establishment.address}{establishment.address_number ? `, ${establishment.address_number}` : ""} {establishment.neighborhood ? `- ${establishment.neighborhood}` : ""}</span>
          )}
          {establishment.open_time && establishment.close_time && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {String(establishment.open_time).slice(0, 5)} - {String(establishment.close_time).slice(0, 5)}</span>
          )}
          {establishment.phone && (
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {establishment.phone}</span>
          )}
        </div>

        {establishment.full_description && (
          <p className="text-xs text-muted-foreground">{establishment.full_description}</p>
        )}

        <div className="flex gap-2">
          {establishment.estimated_delivery_time && (
            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium">🕐 ~{establishment.estimated_delivery_time}min</span>
          )}
          {establishment.delivery_fee > 0 && (
            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium">🛵 R${Number(establishment.delivery_fee).toFixed(2)}</span>
          )}
          {establishment.accepts_pickup && (
            <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium">📦 Retirada</span>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2">
          <span className="text-sm">🔍</span>
          <input
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="px-4 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedCat(null)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                !selectedCat ? "bg-primary text-primary-foreground" : "bg-card border text-muted-foreground"
              }`}
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id === selectedCat ? null : c.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCat === c.id ? "bg-primary text-primary-foreground" : "bg-card border text-muted-foreground"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <main className="flex-1 px-4 py-3 space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="text-4xl mb-3">📦</span>
            <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const inCart = cart.find((c) => c.id === product.id);
            return (
              <div key={product.id} className="rounded-xl border bg-card p-3 flex gap-3">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-xl shrink-0">{emoji}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{product.name}</p>
                  {product.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{product.description}</p>
                  )}
                  <p className="text-sm font-bold text-primary mt-1">R$ {Number(product.price).toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-center justify-end gap-1">
                  {inCart ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(product.id, -1)} className="rounded-full bg-secondary p-1 active:scale-90">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center">{inCart.qty}</span>
                      <button onClick={() => updateQty(product.id, 1)} className="rounded-full bg-primary p-1 text-primary-foreground active:scale-90">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product)}
                      className="rounded-full bg-primary p-2 text-primary-foreground active:scale-90 transition-transform"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 animate-fade-in">
          <button
            onClick={handleCheckout}
            className="flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-xl active:scale-[0.97] transition-transform"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-sm font-bold">{cartCount} {cartCount === 1 ? "item" : "itens"}</span>
            </div>
            <span className="text-base font-bold">R$ {cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default EstablishmentDetail;
