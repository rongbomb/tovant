import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { jobs, quotes, payments, profiles } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { advanceJob } from "../actions";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

const ADVANCE_LABEL: Record<string, string | undefined> = {
  scheduled: "Confirm",
  confirmed: "Start",
  in_progress: "Mark complete",
};

const ESCROW_LABEL: Record<string, string> = {
  not_applicable: "Off-platform — tracked for records only",
  authorized: "Authorized, held in escrow",
  captured: "Captured, held in escrow",
  released: "Released to you",
  refunded: "Refunded to owner",
  disputed: "Disputed — under review",
};

function vehicleSummary(vehicleInfo: unknown) {
  if (!vehicleInfo || typeof vehicleInfo !== "object") return "Vehicle not specified";
  const v = vehicleInfo as { year?: number; make?: string; model?: string };
  return [v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle not specified";
}

export default async function ProviderJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) notFound();

  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });
  if (!job || job.providerUserId !== session.user.id) notFound();

  const [quote, payment, ownerProfile] = await Promise.all([
    db.query.quotes.findFirst({ where: eq(quotes.id, job.quoteId) }),
    db.query.payments.findFirst({ where: eq(payments.jobId, job.id) }),
    db.query.profiles.findFirst({ where: eq(profiles.userId, job.ownerId) }),
  ]);

  const advanceLabel = ADVANCE_LABEL[job.status];

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          {ownerProfile?.displayName ?? "Tovant owner"}
        </h1>
        <p
          className="mt-1 text-xs uppercase tracking-widest"
          style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
        >
          {STATUS_LABEL[job.status] ?? job.status} · {new Date(job.scheduledAt).toLocaleString()}
        </p>
        <Button href={`/provider/messages?jobId=${job.id}`} variant="ghost" style={{ marginTop: 12 }}>
          Message owner
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="home-field-label" style={{ marginBottom: 4 }}>
            Vehicle
          </p>
          <p className="text-sm">{vehicleSummary(quote?.vehicleInfo)}</p>
        </Card>
        <Card>
          <p className="home-field-label" style={{ marginBottom: 4 }}>
            Job description
          </p>
          <p className="text-sm">{quote?.description ?? "—"}</p>
        </Card>
        <Card>
          <p className="home-field-label" style={{ marginBottom: 4 }}>
            Payment
          </p>
          <p className="text-sm">{payment?.amountCents ? `$${(payment.amountCents / 100).toFixed(2)}` : "—"}</p>
          <p className="mt-1 text-sm" style={{ color: "var(--home-text-muted)" }}>
            {payment ? ESCROW_LABEL[payment.escrowStatus] : "No payment on file"}
          </p>
          {payment?.autoReleaseAt ? (
            <p className="mt-1 text-[11px]" style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}>
              Auto-releases {new Date(payment.autoReleaseAt).toLocaleString()} unless disputed
            </p>
          ) : null}
        </Card>
      </section>

      {advanceLabel ? (
        <form action={advanceJob}>
          <input type="hidden" name="jobId" value={job.id} />
          <Button type="submit">{advanceLabel}</Button>
        </form>
      ) : null}
    </div>
  );
}
