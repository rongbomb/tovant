import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import {
  requireOwnership,
  NotFoundError,
  ForbiddenError,
  type SessionUser,
} from "@/lib/security/ownership";

/**
 * Representative implementation of the row-level ownership pattern
 * required by CLAUDE.md for every appointment/quote/message endpoint:
 * requester must be the owner, the provider, or an admin.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });

  try {
    const owned = await requireOwnership(job, session.user as SessionUser);
    return NextResponse.json(owned);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw err;
  }
}
