// Persistência local de clientes/endereços recentes do estabelecimento
// Salva os últimos clientes para sugestões e botão "Usar endereço salvo"

export interface SavedCustomer {
  name: string;
  phone: string;
  address: string;
  reference: string;
  note: string;
  lastUsedAt: number;
}

const MAX_SAVED = 30;

const keyFor = (estId: string) => `est:${estId}:customers`;

export function getSavedCustomers(estId: string): SavedCustomer[] {
  try {
    const raw = localStorage.getItem(keyFor(estId));
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedCustomer[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveCustomer(estId: string, c: Omit<SavedCustomer, "lastUsedAt">) {
  const list = getSavedCustomers(estId);
  const norm = (s: string) => (s || "").trim().toLowerCase();
  const filtered = list.filter(
    (x) => !(norm(x.name) === norm(c.name) && norm(x.address) === norm(c.address)),
  );
  const next: SavedCustomer = { ...c, lastUsedAt: Date.now() };
  const updated = [next, ...filtered].slice(0, MAX_SAVED);
  try {
    localStorage.setItem(keyFor(estId), JSON.stringify(updated));
  } catch {
    // ignore quota
  }
}

export function searchCustomers(estId: string, query: string): SavedCustomer[] {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  return getSavedCustomers(estId)
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        c.address.toLowerCase().includes(q),
    )
    .slice(0, 5);
}
