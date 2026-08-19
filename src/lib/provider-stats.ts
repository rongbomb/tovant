import "server-only";
import { and, eq, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { jobs, quotes, payments } from "@/db/schema";

export interface ProviderStats {
  completedJobsCount: number;
  avgResponseMinutes: number | null;
  quoteWinRate: number | null; // 0-1, null when there's nothing decided yet
  monthEarningsCents: number;
}

/**
 * Shared aggregate queries used by both the public provider profile page
 * and the provider dashboard, so the two never compute the same numbers
 * two different ways.
 */
export async function getProviderStats(
  providerId: string,
  providerUserId: string,
): Promise<ProviderStats> {
  const [[completedRow], [responseRow], [winRow], [earningsRow]] = await Promise.all([
    db
      .select({ n: count() })
      .from(jobs)
      .where(and(eq(jobs.providerId, providerId), eq(jobs.status, "completed"))),
    db
      .select({
        avgMinutes: sql<
          string | null
        >`avg(extract(epoch from (${quotes.quotedAt} - ${quotes.createdAt})) / 60)`,
      })
      .from(quotes)
      .where(and(eq(quotes.providerUserId, providerUserId), sql`${quotes.quotedAt} is not null`)),
    db
      .select({
        accepted: sql<string>`count(*) filter (where ${quotes.status} = 'accepted')`,
        decided: sql<string>`count(*) filter (where ${quotes.status} in ('accepted','declined'))`,
      })
      .from(quotes)
      .where(eq(quotes.providerUserId, providerUserId)),
    db
      .select({ total: sql<string | null>`sum(${payments.amountCents})` })
      .from(payments)
      .where(
        and(
          eq(payments.providerUserId, providerUserId),
          sql`${payments.escrowStatus} in ('released','captured')`,
          sql`date_trunc('month', ${payments.createdAt}) = date_trunc('month', now())`,
        ),
      ),
  ]);

  const decided = Number(winRow.decided ?? 0);
  const accepted = Number(winRow.accepted ?? 0);

  return {
    completedJobsCount: Number(completedRow.n ?? 0),
    avgResponseMinutes: responseRow.avgMinutes ? Math.round(Number(responseRow.avgMinutes)) : null,
    quoteWinRate: decided > 0 ? accepted / decided : null,
    monthEarningsCents: Number(earningsRow.total ?? 0),
  };
}

/**
 * Leads received per week for the last 7 weeks, oldest first. Buckets by
 * "weeks ago" (a plain integer offset from now) rather than
 * date_trunc('week', ...) so there's no Monday-vs-JS-week-start alignment
 * to get wrong when reading the result back out.
 */
export async function getWeeklyLeadCounts(providerUserId: string): Promise<number[]> {
  const rows = await db
    .select({
      weeksAgo: sql<string>`floor(extract(epoch from (now() - ${quotes.createdAt})) / (7*86400))::int`,
      n: count(),
    })
    .from(quotes)
    .where(
      and(eq(quotes.providerUserId, providerUserId), sql`${quotes.createdAt} >= now() - interval '7 weeks'`),
    )
    .groupBy(sql`floor(extract(epoch from (now() - ${quotes.createdAt})) / (7*86400))::int`);

  const countByWeeksAgo = new Map(rows.map((r) => [Number(r.weeksAgo), Number(r.n)]));
  return Array.from({ length: 7 }, (_, i) => countByWeeksAgo.get(6 - i) ?? 0);
}

export interface ProfileCompleteness {
  percent: number;
  missing: { label: string; href: string }[];
}

/**
 * Pure function — callers pass booleans from data they've already
 * fetched, so this never issues its own queries.
 */
export function getProfileCompleteness(input: {
  hasBio: boolean;
  hasCategory: boolean;
  hasServiceOffering: boolean;
  hasHourlyRate: boolean;
  hasApprovedPhoto: boolean;
}): ProfileCompleteness {
  const checks = [
    { done: input.hasBio, label: "Add a bio" },
    { done: input.hasCategory, label: "Choose a category" },
    { done: input.hasServiceOffering, label: "List the services you offer" },
    { done: input.hasHourlyRate, label: "Set your typical hourly rate" },
    { done: input.hasApprovedPhoto, label: "Add an approved recent-work photo" },
  ];
  const doneCount = checks.filter((c) => c.done).length;
  return {
    percent: Math.round((doneCount / checks.length) * 100),
    missing: checks.filter((c) => !c.done).map((c) => ({ label: c.label, href: "/provider/settings" })),
  };
}
