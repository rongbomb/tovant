import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobs, profiles, providerProfiles, providerUnavailableDates } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { CalendarGrid } from "@/components/provider-dashboard/calendar-grid";

export default async function ProviderCalendarPage() {
  const session = await getSession();
  if (!session) {
    return (
      <div className="p-8">
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Calendar
        </h1>
      </div>
    );
  }

  const provider = await db.query.providerProfiles.findFirst({
    where: eq(providerProfiles.userId, session.user.id),
  });

  const [scheduledJobs, unavailable] = await Promise.all([
    db
      .select({
        id: jobs.id,
        status: jobs.status,
        scheduledAt: jobs.scheduledAt,
        ownerName: profiles.displayName,
      })
      .from(jobs)
      .leftJoin(profiles, eq(profiles.userId, jobs.ownerId))
      .where(eq(jobs.providerUserId, session.user.id)),
    provider
      ? db
          .select()
          .from(providerUnavailableDates)
          .where(eq(providerUnavailableDates.providerId, provider.id))
      : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="home-serif" style={{ fontSize: 28 }}>
        Calendar
      </h1>
      <CalendarGrid
        jobs={scheduledJobs.map((j) => ({
          id: j.id,
          status: j.status,
          scheduledAt: j.scheduledAt.toISOString(),
          ownerName: j.ownerName,
        }))}
        unavailableDates={unavailable.map((u) => u.date)}
      />
    </div>
  );
}
