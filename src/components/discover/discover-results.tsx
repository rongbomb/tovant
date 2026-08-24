"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Gauge } from "@/components/ui/gauge";
import { Select, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { distanceMiles } from "@/lib/geo";
import { geocodeSearchLocation } from "@/app/discover/actions";

const ProviderMap = dynamic(
  () => import("./provider-map").then((m) => m.ProviderMap),
  { ssr: false, loading: () => <p className="text-sm" style={{ color: "var(--home-text-muted)" }}>Loading map…</p> },
);

export interface DiscoverProvider {
  id: string;
  businessName: string | null;
  bio: string | null;
  serviceMode: "mobile" | "shop" | "both";
  ratingAvg: number | null;
  ratingCount: number;
  shopCity: string | null;
  categories: string[];
  categoryLabels: string[];
  specialties: string[];
  offeringLabels: string[];
  lat: number | null;
  lng: number | null;
}

type ViewMode = "list" | "grid" | "map";
type SortMode = "rating" | "distance" | "reviews";

const MODE_OPTIONS = [
  { value: "all", label: "Mobile or shop" },
  { value: "mobile", label: "Mobile only" },
  { value: "shop", label: "Shop only" },
];

const RADIUS_OPTIONS = [10, 25, 50, 100];

export function DiscoverResults({
  providers,
  categoryOptions,
  specialtyOptions,
  initialCategory,
  initialNear,
}: {
  providers: DiscoverProvider[];
  categoryOptions: { value: string; label: string }[];
  specialtyOptions: { value: string; label: string }[];
  initialCategory?: string;
  initialNear?: string;
}) {
  const [view, setView] = useState<ViewMode>("list");
  const [category, setCategory] = useState(initialCategory ?? "all");
  const [specialty, setSpecialty] = useState("all");
  const [mode, setMode] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [near, setNear] = useState(initialNear ?? "");
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [sortBy, setSortBy] = useState<SortMode>("rating");
  const [searchCoords, setSearchCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  async function runLocationSearch(query: string) {
    if (!query.trim()) {
      setSearchCoords(null);
      setLocationError(null);
      return;
    }
    setLocating(true);
    setLocationError(null);
    const coords = await geocodeSearchLocation(query);
    setLocating(false);
    if (!coords) {
      setSearchCoords(null);
      setLocationError("Couldn't find that location — try a ZIP code or city.");
      return;
    }
    setSearchCoords(coords);
    setSortBy("distance");
  }

  useEffect(() => {
    if (!initialNear) return;
    // Deferred so the state updates inside runLocationSearch don't fire
    // synchronously within the effect body itself.
    const timeout = setTimeout(() => runLocationSearch(initialNear), 0);
    return () => clearTimeout(timeout);
    // Only auto-run once, off the server-provided initial value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const withDistance = useMemo(() => {
    return providers.map((p) => ({
      ...p,
      distance:
        searchCoords && p.lat !== null && p.lng !== null
          ? distanceMiles(searchCoords.lat, searchCoords.lng, p.lat, p.lng)
          : null,
    }));
  }, [providers, searchCoords]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const result = withDistance.filter((p) => {
      if (category !== "all" && !p.categories.includes(category)) return false;
      if (specialty !== "all" && !p.specialties.includes(specialty)) return false;
      if (mode !== "all" && p.serviceMode !== "both" && p.serviceMode !== mode) return false;
      if (minRating > 0 && (!p.ratingAvg || p.ratingAvg < minRating)) return false;
      if (kw) {
        const haystack = [p.businessName ?? "", p.bio ?? "", ...p.offeringLabels].join(" ").toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      if (searchCoords) {
        if (p.distance === null || p.distance > radiusMiles) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === "distance" && searchCoords) {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      }
      if (sortBy === "reviews") return b.ratingCount - a.ratingCount;
      return (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0);
    });
  }, [withDistance, category, specialty, mode, minRating, keyword, searchCoords, radiusMiles, sortBy]);

  const mappable = filtered.filter(
    (p): p is (typeof filtered)[number] & { lat: number; lng: number } => p.lat !== null && p.lng !== null,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="home-card flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Near"
            type="text"
            placeholder="ZIP code or city"
            value={near}
            onChange={(e) => setNear(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              runLocationSearch(near);
            }}
            style={{ minWidth: 180 }}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => runLocationSearch(near)}
            disabled={locating}
            style={{ padding: "9px 16px", fontSize: 12 }}
          >
            {locating ? "Searching…" : "Search"}
          </Button>
          {searchCoords ? (
            <Select
              label="Within"
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(Number(e.target.value))}
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>{r} mi</option>
              ))}
            </Select>
          ) : null}
          <Input
            label="Keyword"
            type="text"
            placeholder="e.g. brakes, ceramic coating"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ minWidth: 180 }}
          />
        </div>
        {locationError ? (
          <p className="text-xs" style={{ color: "var(--home-danger)" }}>{locationError}</p>
        ) : null}

        <div className="flex flex-wrap items-end gap-4">
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categoryOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          <Select label="Specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            <option value="all">Any specialty</option>
            {specialtyOptions.map((o) => (
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
          <Select label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortMode)}>
            <option value="rating">Highest rated</option>
            <option value="reviews">Most reviewed</option>
            <option value="distance" disabled={!searchCoords}>Nearest{searchCoords ? "" : " (search a location)"}</option>
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
            categories: p.categoryLabels,
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

function ProviderCard({
  provider,
  horizontal = false,
}: {
  provider: DiscoverProvider & { distance: number | null };
  horizontal?: boolean;
}) {
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
            {provider.categoryLabels.join(", ")} · {provider.serviceMode} · {provider.shopCity ?? "mobile"}
            {provider.distance !== null ? ` · ${provider.distance.toFixed(1)} mi` : ""}
          </p>
        </div>
        <Gauge value={provider.ratingAvg ? provider.ratingAvg / 5 : 0} size={56} />
      </Link>
    </li>
  );
}
