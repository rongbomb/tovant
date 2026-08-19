import "server-only";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, jobs } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { toCsvRow } from "@/lib/csv";

export async function GET() {
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== "provider") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rows = await db
    .select({
      jobId: payments.jobId,
      scheduledAt: jobs.scheduledAt,
      mode: payments.mode,
      escrowStatus: payments.escrowStatus,
      amountCents: payments.amountCents,
      releasedAt: payments.releasedAt,
    })
    .from(payments)
    .innerJoin(jobs, eq(jobs.id, payments.jobId))
    .where(eq(payments.providerUserId, session.user.id));

  const lines = [
    toCsvRow(["Job ID", "Scheduled Date", "Payment Mode", "Escrow Status", "Amount (USD)", "Released At"]),
    ...rows.map((r) =>
      toCsvRow([
        r.jobId,
        new Date(r.scheduledAt).toISOString().slice(0, 10),
        r.mode,
        r.escrowStatus,
        r.amountCents !== null ? (r.amountCents / 100).toFixed(2) : "",
        r.releasedAt ? new Date(r.releasedAt).toISOString().slice(0, 10) : "",
      ]),
    ),
  ];

  const csv = lines.join("\n");
  const filename = `tovant-earnings-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
