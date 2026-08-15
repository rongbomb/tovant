import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";

const PIPELINE_COLUMNS = [
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
] as const;

export default async function ProviderDashboardPage() {
  const session = await getSession();
  const providerJobs = session
    ? await db
        .select()
        .from(jobs)
        .where(eq(jobs.providerUserId, session.user.id))
    : [];

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl uppercase tracking-widest text-ash">
        Job pipeline
      </h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PIPELINE_COLUMNS.map((status) => {
          const columnJobs = providerJobs.filter((j) => j.status === status);
          return (
            <div
              key={status}
              className="rounded border border-steel/40 bg-graphite p-4"
            >
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-steel">
                {status.replace("_", " ")} ({columnJobs.length})
              </p>
              {columnJobs.length === 0 ? (
                <p className="text-sm text-steel">No jobs</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {columnJobs.map((job) => (
                    <li
                      key={job.id}
                      className="rounded bg-void px-3 py-2 text-sm text-ash"
                    >
                      {new Date(job.scheduledAt).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
