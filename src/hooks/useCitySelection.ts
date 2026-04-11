import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface City {
  id: string;
  name: string;
  state: string;
}

const CITY_KEY = "selected_city";

export function useCitySelection() {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("cities")
      .select("id, name, state")
      .eq("is_active", true)
      .order("name");

    const cityList = (data || []) as City[];
    setCities(cityList);

    // Restore saved city
    const saved = localStorage.getItem(CITY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as City;
        const found = cityList.find((c) => c.id === parsed.id);
        if (found) setSelectedCity(found);
      } catch {}
    }

    setLoading(false);
  };

  const selectCity = useCallback((city: City) => {
    setSelectedCity(city);
    localStorage.setItem(CITY_KEY, JSON.stringify(city));
  }, []);

  const clearCity = useCallback(() => {
    setSelectedCity(null);
    localStorage.removeItem(CITY_KEY);
  }, []);

  return { cities, selectedCity, loading, selectCity, clearCity };
}
