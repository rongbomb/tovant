import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";

// No separate calendar table — this view is just jobs filtered by
// providerUserId and ordered by scheduledAt (see CLAUDE.md schema notes).
export default async function ProviderCalendarPage() {
  const session = await getSession();
  const upcoming = session
    ? await db
        .select()
        .from(jobs)
        .where(eq(jobs.providerUserId, session.user.id))
        .orderBy(asc(jobs.scheduledAt))
    : [];

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl uppercase tracking-widest text-ash">
        Calendar
      </h1>
      {upcoming.length === 0 ? (
        <p className="mt-4 text-steel">No scheduled jobs.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {upcoming.map((job) => (
            <li
              key={job.id}
              className="flex justify-between rounded border border-steel/40 bg-graphite p-3"
            >
              <span className="font-mono text-ash">
                {new Date(job.scheduledAt).toLocaleString()}
              </span>
              <span className="text-steel">{job.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
