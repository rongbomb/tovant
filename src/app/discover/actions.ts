"use server";

import "server-only";
import { geocodeAddress } from "@/lib/geocoding";

/** Called directly from the discover-results client component on search submit. */
export async function geocodeSearchLocation(query: string) {
  return geocodeAddress(query);
}
