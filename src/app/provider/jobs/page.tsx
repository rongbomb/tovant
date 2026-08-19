import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { jobs, quotes, profiles } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { advanceJob } from "./actions";

const COLUMNS = ["scheduled", "confirmed", "in_progress", "completed"] as const;

const COLUMN_LABEL: Record<(typeof COLUMNS)[number], string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
};

const ADVANCE_LABEL: Record<(typeof COLUMNS)[number], string | null> = {
  scheduled: "Confirm",
  confirmed: "Start",
  in_progress: "Mark complete",
  completed: null,
};

function vehicleSummary(vehicleInfo: unknown) {
  if (!vehicleInfo || typeof vehicleInfo !== "object") return "Vehicle not specified";
  const v = vehicleInfo as { year?: number; make?: string; model?: string };
  return [v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle not specified";
}

export default async function ProviderJobsPage() {
  const session = await getSession();

  const providerJobs = session
    ? await db
        .select({
          id: jobs.id,
          status: jobs.status,
          scheduledAt: jobs.scheduledAt,
          ownerName: profiles.displayName,
          vehicleInfo: quotes.vehicleInfo,
        })
        .from(jobs)
        .leftJoin(quotes, eq(quotes.id, jobs.quoteId))
        .leftJoin(profiles, eq(profiles.userId, jobs.ownerId))
        .where(eq(jobs.providerUserId, session.user.id))
    : [];

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="home-serif" style={{ fontSize: 28 }}>
        Jobs
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((status) => {
          const columnJobs = providerJobs.filter((j) => j.status === status);
          const advanceLabel = ADVANCE_LABEL[status];
          return (
            <Card key={status}>
              <p className="home-field-label" style={{ marginBottom: 12 }}>
                {COLUMN_LABEL[status]} ({columnJobs.length})
              </p>
              {columnJobs.length === 0 ? (
                <EmptyState>No jobs</EmptyState>
              ) : (
                <ul className="flex flex-col gap-2">
                  {columnJobs.map((job) => (
                    <li
                      key={job.id}
                      style={{ borderRadius: 10, background: "var(--home-tint)", padding: 12 }}
                    >
                      <Link href={`/provider/jobs/${job.id}`} className="block">
                        <p className="text-sm font-semibold">{job.ownerName ?? "Tovant owner"}</p>
                        <p
                          className="text-[11px]"
                          style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
                        >
                          {vehicleSummary(job.vehicleInfo)}
                        </p>
                        <p
                          className="mt-1 text-[11px]"
                          style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
                        >
                          {new Date(job.scheduledAt).toLocaleDateString()}
                        </p>
                      </Link>
                      {advanceLabel ? (
                        <form action={advanceJob} className="mt-2">
                          <input type="hidden" name="jobId" value={job.id} />
                          <Button type="submit" style={{ width: "100%", padding: "9px 12px", fontSize: 11 }}>
                            {advanceLabel}
                          </Button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
