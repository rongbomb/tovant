import Link from "next/link";
import { eq, and, inArray, asc } from "drizzle-orm";
import { db } from "@/db";
import { quotes, jobs, providerProfiles, vehicles } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const JOB_STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

function greetingPeriod() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function vehicleSummary(vehicleInfo: unknown) {
  if (!vehicleInfo || typeof vehicleInfo !== "object") return "Vehicle not specified";
  const v = vehicleInfo as { year?: number; make?: string; model?: string };
  return [v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle not specified";
}

export default async function OwnerDashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const [quotedQuotes, requestedQuotes, upcomingJobs, vehicleCount] = await Promise.all([
    db
      .select({
        id: quotes.id,
        description: quotes.description,
        vehicleInfo: quotes.vehicleInfo,
        quotedAmountCents: quotes.quotedAmountCents,
        businessName: providerProfiles.businessName,
      })
      .from(quotes)
      .innerJoin(providerProfiles, eq(providerProfiles.id, quotes.providerId))
      .where(and(eq(quotes.ownerId, session.user.id), eq(quotes.status, "quoted"))),
    db
      .select({ id: quotes.id })
      .from(quotes)
      .where(and(eq(quotes.ownerId, session.user.id), eq(quotes.status, "requested"))),
    db
      .select({
        id: jobs.id,
        status: jobs.status,
        scheduledAt: jobs.scheduledAt,
        businessName: providerProfiles.businessName,
      })
      .from(jobs)
      .innerJoin(providerProfiles, eq(providerProfiles.id, jobs.providerId))
      .where(
        and(
          eq(jobs.ownerId, session.user.id),
          inArray(jobs.status, ["scheduled", "confirmed", "in_progress"]),
        ),
      )
      .orderBy(asc(jobs.scheduledAt))
      .limit(5),
    db.select().from(vehicles).where(eq(vehicles.ownerId, session.user.id)),
  ]);

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Good {greetingPeriod()}, {session.user.name.split(" ")[0]}
        </h1>
        <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
          Here&apos;s what&apos;s happening with your vehicles and requests.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <p className="home-field-label">Upcoming jobs</p>
          <p style={{ fontFamily: "var(--home-font-mono)", fontSize: 24, fontWeight: 600, marginTop: 6 }}>
            {upcomingJobs.length}
          </p>
        </Card>
        <Card>
          <p className="home-field-label">Quotes to review</p>
          <p style={{ fontFamily: "var(--home-font-mono)", fontSize: 24, fontWeight: 600, marginTop: 6 }}>
            {quotedQuotes.length}
          </p>
        </Card>
        <Card>
          <p className="home-field-label">Awaiting response</p>
          <p style={{ fontFamily: "var(--home-font-mono)", fontSize: 24, fontWeight: 600, marginTop: 6 }}>
            {requestedQuotes.length}
          </p>
        </Card>
        <Card>
          <p className="home-field-label">Saved vehicles</p>
          <p style={{ fontFamily: "var(--home-font-mono)", fontSize: 24, fontWeight: 600, marginTop: 6 }}>
            {vehicleCount.length}
          </p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 className="home-serif" style={{ fontSize: 18 }}>
              Needs your attention
            </h2>
            <Link href="/owner/jobs" style={{ fontSize: 13, color: "var(--home-accent)" }}>
              View all →
            </Link>
          </div>
          {quotedQuotes.length === 0 ? (
            <EmptyState>No quotes waiting on you right now.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {quotedQuotes.map((q) => (
                <li
                  key={q.id}
                  className="flex items-center justify-between gap-3"
                  style={{ paddingBottom: 12, borderBottom: "1px solid var(--home-line)" }}
                >
                  <div>
                    <p className="font-semibold text-sm">{q.businessName ?? "Unnamed provider"}</p>
                    <p className="text-xs" style={{ color: "var(--home-text-muted)" }}>
                      {vehicleSummary(q.vehicleInfo)}
                    </p>
                  </div>
                  <p style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-accent)", fontWeight: 600 }}>
                    {q.quotedAmountCents ? `$${(q.quotedAmountCents / 100).toFixed(2)}` : "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 className="home-serif" style={{ fontSize: 18 }}>
              Upcoming jobs
            </h2>
            <Link href="/owner/jobs" style={{ fontSize: 13, color: "var(--home-accent)" }}>
              View all →
            </Link>
          </div>
          {upcomingJobs.length === 0 ? (
            <EmptyState>Nothing scheduled yet.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {upcomingJobs.map((j) => (
                <li key={j.id}>
                  <Link
                    href={`/owner/jobs/${j.id}`}
                    className="flex items-center justify-between gap-3"
                    style={{ paddingBottom: 12, borderBottom: "1px solid var(--home-line)" }}
                  >
                    <div>
                      <p className="font-semibold text-sm">{j.businessName ?? "Unnamed provider"}</p>
                      <p
                        className="text-xs"
                        style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
                      >
                        {new Date(j.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge tone="neutral">{JOB_STATUS_LABEL[j.status] ?? j.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="home-serif" style={{ fontSize: 18 }}>
            Need something fixed?
          </h2>
          <p className="home-lede" style={{ marginTop: 4, fontSize: 14 }}>
            Find a verified mechanic or detailer near you.
          </p>
        </div>
        <Button href="/discover">Find a pro</Button>
      </Card>
    </div>
  );
}
