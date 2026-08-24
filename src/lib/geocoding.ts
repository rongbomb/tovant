import "server-only";

/**
 * Free, keyless geocoding via OpenStreetMap's Nominatim — same OSM data
 * source the discover map's tiles already come from (src/components/discover/provider-map.tsx),
 * so this doesn't introduce a new third-party dependency, just a second
 * kind of call to one already in the stack. Unlike Stripe/Checkr/Twilio/
 * Postmark/S3 (src/lib/integrations/), there's no stub/live split here —
 * Nominatim needs no credentials, so it's live from the start.
 *
 * Nominatim's usage policy caps public-instance traffic at ~1 request/sec
 * and requires an identifying User-Agent. That's fine for this app's
 * current call sites (an admin/provider saving their address, an owner
 * submitting a search) — none of which fire faster than a human typing —
 * but a self-hosted or paid geocoder should replace this before any
 * higher-volume production traffic.
 */
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Tovant/1.0 (marketplace pilot, contact: samsamajavon@gmail.com)";

export async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // countrycodes=us: without it, a bare ZIP code is ambiguous worldwide —
  // e.g. "55101" (Saint Paul, MN) also resolves to a real postcode in
  // Jonava, Lithuania, and Nominatim has no other context to prefer one.
  // Scoped to the US since the pilot market (Minneapolis-St. Paul) is
  // US-only for now; revisit if the app ever expands outside the US.
  const params = new URLSearchParams({ q: trimmed, format: "json", limit: "1", countrycodes: "us" });

  try {
    const res = await fetch(`${NOMINATIM_SEARCH_URL}?${params.toString()}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return null;

    const results = (await res.json()) as { lat: string; lon: string }[];
    const first = results[0];
    if (!first) return null;

    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng };
  } catch {
    return null;
  }
}
