import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface DeliveryMapProps {
  pickupCoords: [number, number] | null;
  deliveryCoords: [number, number] | null;
  routeCoords: [number, number][];
}

const DeliveryMap = ({ pickupCoords, deliveryCoords, routeCoords }: DeliveryMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Default center: Cabo Verde - MG
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

    // Clean previous markers
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.remove();
      deliveryMarkerRef.current = null;
    }
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    const greenIcon = L.divIcon({
      className: "",
      html: `<div style="background:#16a34a;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const redIcon = L.divIcon({
      className: "",
      html: `<div style="background:#dc2626;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    if (pickupCoords) {
      pickupMarkerRef.current = L.marker(pickupCoords, { icon: greenIcon }).addTo(mapRef.current);
    }
    if (deliveryCoords) {
      deliveryMarkerRef.current = L.marker(deliveryCoords, { icon: redIcon }).addTo(mapRef.current);
    }

    if (routeCoords.length > 1) {
      routeLineRef.current = L.polyline(routeCoords, {
        color: "#16a34a",
        weight: 4,
        opacity: 0.8,
      }).addTo(mapRef.current);
    }

    // Fit bounds
    const bounds: [number, number][] = [];
    if (pickupCoords) bounds.push(pickupCoords);
    if (deliveryCoords) bounds.push(deliveryCoords);

    if (bounds.length === 2) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    } else if (bounds.length === 1) {
      mapRef.current.setView(bounds[0], 15);
    }
  }, [pickupCoords, deliveryCoords, routeCoords]);

  return (
    <div
      ref={containerRef}
      className="h-48 w-full rounded-xl overflow-hidden border shadow-sm"
      style={{ zIndex: 0 }}
    />
  );
};

export default DeliveryMap;
