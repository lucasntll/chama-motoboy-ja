import { useState, useEffect, useCallback } from "react";

export interface SavedAddress {
  label: "Casa" | "Trabalho" | "Outro";
  address: string;
  houseRef: string;
  coords?: [number, number];
  isDefault?: boolean;
}

export interface ClientData {
  name: string;
  phone: string;
  addresses: SavedAddress[];
}

export interface LastOrder {
  category: string;
  orderDesc: string;
  purchaseLocation: string;
  deliveryAddress: string;
  deliveryCoords: [number, number] | null;
  houseRef: string;
  customerName: string;
  customerPhone: string;
}

const CLIENT_KEY = "client_data";
const LAST_ORDER_KEY = "last_order";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const emptyClient: ClientData = { name: "", phone: "", addresses: [] };

/** Merge legacy profile keys into client_data on first load */
function loadClientWithFallbacks(): ClientData {
  const saved = load(CLIENT_KEY, emptyClient);
  // Fallback: read from legacy "user_profile" or "profile_name"/"profile_phone"
  if (!saved.name) {
    const legacy = load<{ name?: string; phone?: string }>("user_profile", {});
    if (legacy.name) saved.name = legacy.name;
    else {
      const pn = localStorage.getItem("profile_name");
      if (pn) saved.name = pn;
    }
  }
  if (!saved.phone) {
    const legacy = load<{ name?: string; phone?: string }>("user_profile", {});
    if (legacy.phone) saved.phone = legacy.phone;
    else {
      const pp = localStorage.getItem("profile_phone");
      if (pp) saved.phone = pp;
    }
  }
  return saved;
}

export function useClientData() {
  const [data, setData] = useState<ClientData>(() => loadClientWithFallbacks());
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(() => load(LAST_ORDER_KEY, null));

  const hasSavedData = !!(data.name || data.phone || data.addresses.length);

  const persist = useCallback((next: ClientData) => {
    setData(next);
    localStorage.setItem(CLIENT_KEY, JSON.stringify(next));
    // Keep legacy keys in sync so other pages (Profile, RequestRide) work
    if (next.name) localStorage.setItem("profile_name", next.name);
    if (next.phone) localStorage.setItem("profile_phone", next.phone);
    try {
      const profile = load<{ name?: string; phone?: string; photo?: string }>("user_profile", {});
      profile.name = next.name;
      profile.phone = next.phone;
      localStorage.setItem("user_profile", JSON.stringify(profile));
    } catch {}
  }, []);

  const saveAfterOrder = useCallback(
    (order: LastOrder) => {
      // Update client data
      const updated: ClientData = {
        name: order.customerName || data.name,
        phone: order.customerPhone || data.phone,
        addresses: data.addresses,
      };

      // Auto-add address if not already saved
      if (order.deliveryAddress && !data.addresses.some((a) => a.address === order.deliveryAddress)) {
        const label: SavedAddress["label"] =
          data.addresses.length === 0 ? "Casa" : data.addresses.length === 1 ? "Trabalho" : "Outro";
        updated.addresses.push({
          label,
          address: order.deliveryAddress,
          houseRef: order.houseRef,
          coords: order.deliveryCoords ?? undefined,
          isDefault: data.addresses.length === 0,
        });
      }

      persist(updated);
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
      setLastOrder(order);
    },
    [data, persist],
  );

  const addAddress = useCallback(
    (addr: SavedAddress) => {
      const next = { ...data, addresses: [...data.addresses, addr] };
      if (addr.isDefault) {
        next.addresses = next.addresses.map((a) => ({ ...a, isDefault: a === addr }));
      }
      persist(next);
    },
    [data, persist],
  );

  const removeAddress = useCallback(
    (index: number) => {
      const addrs = data.addresses.filter((_, i) => i !== index);
      persist({ ...data, addresses: addrs });
    },
    [data, persist],
  );

  const setDefaultAddress = useCallback(
    (index: number) => {
      const addrs = data.addresses.map((a, i) => ({ ...a, isDefault: i === index }));
      persist({ ...data, addresses: addrs });
    },
    [data, persist],
  );

  const updateAddress = useCallback(
    (index: number, addr: SavedAddress) => {
      const addrs = [...data.addresses];
      addrs[index] = addr;
      persist({ ...data, addresses: addrs });
    },
    [data, persist],
  );

  const clearAll = useCallback(() => {
    localStorage.removeItem(CLIENT_KEY);
    localStorage.removeItem(LAST_ORDER_KEY);
    setData(emptyClient);
    setLastOrder(null);
  }, []);

  return {
    data,
    lastOrder,
    hasSavedData,
    saveAfterOrder,
    addAddress,
    removeAddress,
    setDefaultAddress,
    updateAddress,
    clearAll,
  };
}
