import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./auth";

// Memoized per request so a route-group layout's requireRole() check and
// the page it renders don't each pay for a separate session lookup.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});
