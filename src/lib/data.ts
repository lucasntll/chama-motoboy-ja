export interface Motoboy {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate?: string;
  photo: string;
  region: string;
  rating: number;
  totalRides: number;
}

export interface RideRequest {
  id: string;
  motoboyId: string;
  motoboyName: string;
  motoboyPhoto: string;
  motoboyPhone: string;
  motoboyVehicle: string;
  motoboyPlate?: string;
  pickupAddress: string;
  deliveryAddress: string;
  date: string;
  rating?: number;
}

export interface UserProfile {
  name: string;
  phone: string;
  photo: string;
}

// Motoboys are loaded from localStorage. Start empty — add real ones via addMotoboy().
const STORAGE_KEY = "motoboys";

export function getMotoboys(): Motoboy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMotoboys(list: Motoboy[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addMotoboy(m: Omit<Motoboy, "id" | "rating" | "totalRides">): Motoboy {
  const motoboy: Motoboy = {
    ...m,
    id: Date.now().toString(),
    rating: 5,
    totalRides: 0,
  };
  const list = getMotoboys();
  list.push(motoboy);
  saveMotoboys(list);
  return motoboy;
}

export function getRegions(): string[] {
  const motoboys = getMotoboys();
  const unique = [...new Set(motoboys.map((m) => m.region))];
  return unique.sort();
}

export const DEFAULT_PROFILE: UserProfile = {
  name: "",
  phone: "",
  photo: "",
};
