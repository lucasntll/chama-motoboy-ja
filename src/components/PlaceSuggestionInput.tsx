import { useState, useRef, useEffect, useCallback } from "react";
import { Store, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PlaceSuggestionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

interface PopularPlace {
  id: string;
  name: string;
  usage_count: number;
}

const PlaceSuggestionInput = ({ value, onChange, placeholder }: PlaceSuggestionInputProps) => {
  const [suggestions, setSuggestions] = useState<PopularPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchPlaces = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("popular_places")
        .select("*")
        .ilike("name", `%${query}%`)
        .order("usage_count", { ascending: false })
        .limit(5);
      setSuggestions((data as PopularPlace[]) || []);
      setLoading(false);
    }, 300);
  }, []);

  const handleChange = (text: string) => {
    onChange(text);
    searchPlaces(text);
    setShowSuggestions(true);
  };

  const selectSuggestion = (place: PopularPlace) => {
    onChange(place.name);
    setShowSuggestions(false);
    // Increment usage
    supabase
      .from("popular_places")
      .update({ usage_count: place.usage_count + 1 } as any)
      .eq("id", place.id)
      .then();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3">
        <Store className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-xl border bg-card shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => selectSuggestion(s)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-secondary transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <span className="flex items-center gap-2">
                <Store className="h-3.5 w-3.5 text-muted-foreground" />
                {s.name}
              </span>
              <span className="text-xs text-muted-foreground">{s.usage_count}x</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaceSuggestionInput;

/** Save a place name to popular_places (upsert) */
export async function savePopularPlace(name: string) {
  if (!name.trim()) return;
  const trimmed = name.trim();
  const { data: existing } = await supabase
    .from("popular_places")
    .select("id, usage_count")
    .eq("name", trimmed)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("popular_places")
      .update({ usage_count: (existing as any).usage_count + 1 } as any)
      .eq("id", (existing as any).id);
  } else {
    await supabase.from("popular_places").insert({ name: trimmed } as any);
  }
}
