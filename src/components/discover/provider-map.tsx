"use client";

import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";

export interface MappableProvider {
  id: string;
  businessName: string | null;
  categories: string[];
  ratingAvg: number | null;
  lat: number;
  lng: number;
}

// A small on-brand dot instead of Leaflet's default marker icon, which
// needs bundler-specific asset-path workarounds we don't otherwise need.
const markerIcon = L.divIcon({
  className: "",
  html: '<span style="display:block;width:14px;height:14px;border-radius:50%;background:#235347;border:2px solid #ffffff;box-shadow:0 0 0 2px rgba(35,83,71,0.35)"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const MSP_CENTER: [number, number] = [44.9537, -93.09];

export function ProviderMap({ providers }: { providers: MappableProvider[] }) {
  const center = useMemo<[number, number]>(() => {
    if (providers.length === 0) return MSP_CENTER;
    const lat = providers.reduce((sum, p) => sum + p.lat, 0) / providers.length;
    const lng = providers.reduce((sum, p) => sum + p.lng, 0) / providers.length;
    return [lat, lng];
  }, [providers]);

  return (
    <div className="h-[520px] overflow-hidden" style={{ borderRadius: 16, border: "1px solid var(--home-line)" }}>
      <MapContainer center={center} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {providers.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={markerIcon}>
            <Popup>
              <div className="flex flex-col gap-1">
                <strong>{p.businessName ?? "Unnamed provider"}</strong>
                <span>{p.categories.join(", ")}</span>
                {p.ratingAvg ? <span>{p.ratingAvg.toFixed(1)} / 5</span> : null}
                <Link href={`/providers/${p.id}`} style={{ color: "#235347", textDecoration: "underline" }}>
                  View profile
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
