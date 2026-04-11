import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface TrackingMapProps {
  motoboyCoords: [number, number] | null;
  deliveryCoords: [number, number] | null;
  status: string;
}

const TrackingMap = ({ motoboyCoords, deliveryCoords, status }: TrackingMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const motoboyMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);

  const defaultCenter: [number, number] = [-21.4714, -46.3947];

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(defaultCenter, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Motoboy marker (blue pulsing dot)
    if (motoboyMarkerRef.current) motoboyMarkerRef.current.remove();
    if (motoboyCoords) {
      const motoboyIcon = L.divIcon({
        className: "",
        html: `<div style="position:relative">
          <div style="background:#3b82f6;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.5);position:relative;z-index:2"></div>
          <div style="position:absolute;top:-6px;left:-6px;width:30px;height:30px;border-radius:50%;background:rgba(59,130,246,0.25);animation:pulse 2s infinite;z-index:1"></div>
        </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      motoboyMarkerRef.current = L.marker(motoboyCoords, { icon: motoboyIcon })
        .bindTooltip("🏍️ Motoboy", { permanent: false, direction: "top" })
        .addTo(mapRef.current);
    }

    // Delivery marker (red pin)
    if (deliveryMarkerRef.current) deliveryMarkerRef.current.remove();
    if (deliveryCoords) {
      const deliveryIcon = L.divIcon({
        className: "",
        html: `<div style="background:#dc2626;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(220,38,38,0.4)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      deliveryMarkerRef.current = L.marker(deliveryCoords, { icon: deliveryIcon })
        .bindTooltip("📍 Entrega", { permanent: false, direction: "top" })
        .addTo(mapRef.current);
    }

    // Fit bounds
    const bounds: [number, number][] = [];
    if (motoboyCoords) bounds.push(motoboyCoords);
    if (deliveryCoords) bounds.push(deliveryCoords);

    if (bounds.length === 2) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (bounds.length === 1) {
      mapRef.current.setView(bounds[0], 15);
    }
  }, [motoboyCoords, deliveryCoords]);

  // Add CSS animation for pulsing
  useEffect(() => {
    if (document.getElementById("tracking-pulse-style")) return;
    const style = document.createElement("style");
    style.id = "tracking-pulse-style";
    style.textContent = `@keyframes pulse{0%{transform:scale(1);opacity:0.6}50%{transform:scale(1.8);opacity:0}100%{transform:scale(1);opacity:0}}`;
    document.head.appendChild(style);
  }, []);

  const isActive = ["accepted", "picking_up", "delivering"].includes(status);

  if (!isActive && !deliveryCoords) return null;

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase">
          {isActive ? "📍 Rastreamento em tempo real" : "📍 Local de entrega"}
        </h3>
        {isActive && motoboyCoords && (
          <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Ao vivo
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        className="h-52 w-full"
        style={{ zIndex: 0 }}
      />
      {isActive && (
        <div className="flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground border-t">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" /> Motoboy
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 inline-block" /> Destino
          </span>
        </div>
      )}
    </div>
  );
};

export default TrackingMap;
