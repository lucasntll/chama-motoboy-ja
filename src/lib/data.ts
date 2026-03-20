export interface Motoboy {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
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
  motoboyPlate: string;
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

export const MOTOBOYS: Motoboy[] = [
  {
    id: "1",
    name: "Carlos Silva",
    phone: "5511999887766",
    vehicle: "Honda CG 160",
    plate: "ABC-1234",
    photo: "",
    region: "Centro",
    rating: 4.8,
    totalRides: 247,
  },
  {
    id: "2",
    name: "Rafael Souza",
    phone: "5511988776655",
    vehicle: "Yamaha Factor 150",
    plate: "DEF-5678",
    photo: "",
    region: "Vila Nova",
    rating: 4.6,
    totalRides: 183,
  },
  {
    id: "3",
    name: "Lucas Oliveira",
    phone: "5511977665544",
    vehicle: "Honda Bros 160",
    plate: "GHI-9012",
    photo: "",
    region: "Jardim América",
    rating: 4.9,
    totalRides: 312,
  },
  {
    id: "4",
    name: "Pedro Santos",
    phone: "5511966554433",
    vehicle: "Yamaha Crosser 150",
    plate: "JKL-3456",
    photo: "",
    region: "Centro",
    rating: 4.3,
    totalRides: 98,
  },
  {
    id: "5",
    name: "André Costa",
    phone: "5511955443322",
    vehicle: "Honda Pop 110",
    plate: "MNO-7890",
    photo: "",
    region: "Bairro Alto",
    rating: 4.7,
    totalRides: 156,
  },
];

export const REGIONS = ["Todos", "Centro", "Vila Nova", "Jardim América", "Bairro Alto"];

export const DEFAULT_PROFILE: UserProfile = {
  name: "Maria Fernanda",
  phone: "5511944332211",
  photo: "",
};
