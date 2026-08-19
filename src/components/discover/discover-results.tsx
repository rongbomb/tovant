"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Gauge } from "@/components/ui/gauge";
import { Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";

const ProviderMap = dynamic(
  () => import("./provider-map").then((m) => m.ProviderMap),
  { ssr: false, loading: () => <p className="text-sm" style={{ color: "var(--home-text-muted)" }}>Loading map…</p> },
);

export interface DiscoverProvider {
  id: string;
  businessName: string | null;
  serviceMode: "mobile" | "shop" | "both";
  ratingAvg: number | null;
  ratingCount: number;
  shopCity: string | null;
  categories: string[];
  lat: number | null;
  lng: number | null;
}

type ViewMode = "list" | "grid" | "map";

const MODE_OPTIONS = [
  { value: "all", label: "Mobile or shop" },
  { value: "mobile", label: "Mobile only" },
  { value: "shop", label: "Shop only" },
];

export function DiscoverResults({
  providers,
  categoryOptions,
}: {
  providers: DiscoverProvider[];
  categoryOptions: { value: string; label: string }[];
}) {
  const [view, setView] = useState<ViewMode>("list");
  const [category, setCategory] = useState("all");
  const [mode, setMode] = useState("all");
  const [minRating, setMinRating] = useState(0);

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      if (category !== "all" && !p.categories.includes(category)) return false;
      if (mode !== "all" && p.serviceMode !== "both" && p.serviceMode !== mode) return false;
      if (minRating > 0 && (!p.ratingAvg || p.ratingAvg < minRating)) return false;
      return true;
    });
  }, [providers, category, mode, minRating]);

  const mappable = filtered.filter(
    (p): p is DiscoverProvider & { lat: number; lng: number } => p.lat !== null && p.lng !== null,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="home-card flex flex-wrap items-end gap-4">
        <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categoryOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
        <Select label="Service mode" value={mode} onChange={(e) => setMode(e.target.value)}>
          {MODE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
        <Select label="Minimum rating" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
          <option value={0}>Any</option>
          <option value={3}>3+</option>
          <option value={4}>4+</option>
          <option value={4.5}>4.5+</option>
        </Select>

        <div className="ml-auto flex gap-1">
          {(["list", "grid", "map"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`home-btn ${view === v ? "home-btn-primary" : "home-btn-ghost"}`}
              style={{ padding: "9px 16px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <p
        className="text-xs uppercase tracking-widest"
        style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
      >
        {filtered.length} verified {filtered.length === 1 ? "pro" : "pros"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState>No verified pros match those filters yet.</EmptyState>
      ) : view === "map" ? (
        <ProviderMap
          providers={mappable.map((p) => ({
            id: p.id,
            businessName: p.businessName,
            categories: p.categories,
            ratingAvg: p.ratingAvg,
            lat: p.lat,
            lng: p.lng,
          }))}
        />
      ) : view === "grid" ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((p) => (
            <ProviderCard key={p.id} provider={p} horizontal />
          ))}
        </ul>
      )}
    </div>
  );
}

function ProviderCard({ provider, horizontal = false }: { provider: DiscoverProvider; horizontal?: boolean }) {
  return (
    <li>
      <Link
        href={`/providers/${provider.id}`}
        className="home-card flex gap-4 transition-colors"
        style={horizontal ? { flexDirection: "row", alignItems: "center", justifyContent: "space-between" } : { flexDirection: "column" }}
      >
        <div>
          <p className="font-semibold">{provider.businessName ?? "Unnamed provider"}</p>
          <p className="text-sm" style={{ color: "var(--home-text-muted)" }}>
            {provider.categories.join(", ")} · {provider.serviceMode} · {provider.shopCity ?? "mobile"}
          </p>
        </div>
        <Gauge value={provider.ratingAvg ? provider.ratingAvg / 5 : 0} size={56} />
      </Link>
    </li>
  );
}
