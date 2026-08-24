import { NextRequest, NextResponse } from "next/server";
import { sweepAutoReleasablePayments } from "@/lib/payments/escrow";

/**
 * Sweeps every payment whose 72h (admin-configurable) auto-release window
 * has passed and releases it, skipping anything under an open dispute.
 * No queue/cron system exists in this repo yet — this route is meant to be
 * hit by an external scheduler (Vercel Cron, a GitHub Action, etc.) on an
 * hourly-or-so cadence, authenticated with a shared secret rather than a
 * user session since there's no human caller.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sweepAutoReleasablePayments();
  return NextResponse.json(result);
}
