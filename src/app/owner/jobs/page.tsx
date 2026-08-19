import { eq, and, inArray, desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { quotes, jobs, providerProfiles } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { acceptQuote, declineQuote } from "./actions";

const JOB_STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

function vehicleSummary(vehicleInfo: unknown) {
  if (!vehicleInfo || typeof vehicleInfo !== "object") return "Vehicle not specified";
  const v = vehicleInfo as { year?: number; make?: string; model?: string };
  return [v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle not specified";
}

export default async function OwnerJobsPage() {
  const session = await getSession();

  const [myQuotes, ownerJobs] = session
    ? await Promise.all([
        db
          .select({
            id: quotes.id,
            description: quotes.description,
            vehicleInfo: quotes.vehicleInfo,
            status: quotes.status,
            quotedAmountCents: quotes.quotedAmountCents,
            createdAt: quotes.createdAt,
            businessName: providerProfiles.businessName,
          })
          .from(quotes)
          .innerJoin(providerProfiles, eq(providerProfiles.id, quotes.providerId))
          .where(
            and(eq(quotes.ownerId, session.user.id), inArray(quotes.status, ["requested", "quoted"])),
          )
          .orderBy(desc(quotes.createdAt)),
        db
          .select({
            id: jobs.id,
            status: jobs.status,
            scheduledAt: jobs.scheduledAt,
            businessName: providerProfiles.businessName,
          })
          .from(jobs)
          .innerJoin(providerProfiles, eq(providerProfiles.id, jobs.providerId))
          .where(eq(jobs.ownerId, session.user.id))
          .orderBy(desc(jobs.scheduledAt)),
      ])
    : [[], []];

  return (
    <div className="flex flex-col gap-10 p-8">
      <div>
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          My jobs
        </h1>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="home-serif" style={{ fontSize: 20 }}>
          Quote requests
        </h2>
        {myQuotes.length === 0 ? (
          <EmptyState>No pending requests.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {myQuotes.map((q) => (
              <Card key={q.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{q.businessName ?? "Unnamed provider"}</p>
                    <p className="text-sm" style={{ color: "var(--home-text-muted)" }}>
                      {vehicleSummary(q.vehicleInfo)} · {q.description}
                    </p>
                  </div>
                  {q.status === "quoted" ? (
                    <p style={{ fontFamily: "var(--home-font-mono)", fontSize: 18, color: "var(--home-accent)" }}>
                      {q.quotedAmountCents ? `$${(q.quotedAmountCents / 100).toFixed(2)}` : "—"}
                    </p>
                  ) : (
                    <Badge tone="neutral">Awaiting response</Badge>
                  )}
                </div>

                {q.status === "quoted" ? (
                  <div className="mt-4 flex flex-wrap items-end gap-2">
                    <form action={acceptQuote} className="flex items-end gap-2">
                      <input type="hidden" name="quoteId" value={q.id} />
                      <Input label="Schedule for" type="datetime-local" name="scheduledAt" required />
                      <Button type="submit">Accept</Button>
                    </form>
                    <Button href={`/owner/messages?quoteId=${q.id}`} variant="ghost">
                      Message
                    </Button>
                    <form action={declineQuote}>
                      <input type="hidden" name="quoteId" value={q.id} />
                      <Button type="submit" variant="ghost">
                        Decline
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button href={`/owner/messages?quoteId=${q.id}`} variant="ghost">
                      Message
                    </Button>
                    <form action={declineQuote}>
                      <input type="hidden" name="quoteId" value={q.id} />
                      <Button type="submit" variant="ghost">
                        Cancel request
                      </Button>
                    </form>
                  </div>
                )}
              </Card>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="home-serif" style={{ fontSize: 20 }}>
          Jobs
        </h2>
        {ownerJobs.length === 0 ? (
          <EmptyState>No jobs yet.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {ownerJobs.map((j) => (
              <li key={j.id}>
                <Link href={`/owner/jobs/${j.id}`} className="home-card flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{j.businessName ?? "Unnamed provider"}</p>
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
      </section>
    </div>
  );
}
