import { useState, useCallback, useRef } from "react";

interface GeoResult {
  lat: number;
  lon: number;
  display_name: string;
}

export function useGeocoding() {
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const searchAddress = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Cabo Verde, MG, Brasil")}&limit=5&addressdetails=1`
        );
        const data: (GeoResult & { address?: Record<string, string> })[] = await res.json();
        // Format to show only street + Cabo Verde
        const formatted = data.map((item) => {
          const road = item.address?.road || item.address?.pedestrian || "";
          const suburb = item.address?.suburb || item.address?.neighbourhood || "";
          const parts = [road, suburb, "Cabo Verde"].filter(Boolean);
          return {
            ...item,
            display_name: parts.join(", "),
          };
        });
        setSuggestions(formatted);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  return { suggestions, loading, searchAddress, clearSuggestions };
}

export async function getRoute(
  from: [number, number],
  to: [number, number]
): Promise<{ distance: number; duration: number; coordinates: [number, number][] }> {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.routes?.[0]) {
      const route = data.routes[0];
      return {
        distance: route.distance / 1000, // km
        duration: Math.ceil(route.duration / 60), // min
        coordinates: route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]),
      };
    }
  } catch {
    // fallback: haversine
  }

  // Haversine fallback
  const R = 6371;
  const dLat = ((to[0] - from[0]) * Math.PI) / 180;
  const dLon = ((to[1] - from[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from[0] * Math.PI) / 180) * Math.cos((to[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return {
    distance: Math.round(dist * 10) / 10,
    duration: Math.ceil((dist / 30) * 60), // ~30km/h
    coordinates: [from, to],
  };
}

export function useCurrentLocation() {
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback((): Promise<{ lat: number; lon: number; address: string } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            setLoading(false);
            const road = data.address?.road || data.address?.pedestrian || "";
            const suburb = data.address?.suburb || data.address?.neighbourhood || "";
            const shortAddr = [road, suburb, "Cabo Verde"].filter(Boolean).join(", ");
            resolve({
              lat: latitude,
              lon: longitude,
              address: shortAddr || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            });
          } catch {
            setLoading(false);
            resolve({ lat: latitude, lon: longitude, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
          }
        },
        () => {
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  return { getLocation, loading };
}
