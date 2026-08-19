import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import {
  providerProfiles,
  quotes,
  payments,
  jobs,
  verificationRecords,
  profiles,
  providerCategories,
  providerServiceOfferings,
  providerGalleryPhotos,
  reviews,
} from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { getProviderStats, getWeeklyLeadCounts, getProfileCompleteness } from "@/lib/provider-stats";
import { Gauge } from "@/components/ui/gauge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableHead, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { sendQuote, declineQuote, toggleAcceptingLeads } from "./actions";

const VERIFICATION_LABEL: Record<string, string> = {
  identity: "Identity",
  license: "License & insurance",
  insurance: "License & insurance",
  background_check: "Background check",
  specialty_credential: "Specialty certification",
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export default async function ProviderDashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const provider = await db.query.providerProfiles.findFirst({
    where: eq(providerProfiles.userId, session.user.id),
  });
  if (!provider) {
    return (
      <div className="p-8">
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Complete your provider profile
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--home-text-muted)" }}>
          You need a provider profile before your dashboard has anything to show.
        </p>
      </div>
    );
  }

  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [
    stats,
    leads,
    recentPayments,
    weekJobs,
    verifications,
    weeklyLeadCounts,
    categoryRows,
    offeringRows,
    approvedPhotoRows,
    recentReviewRatings,
    pendingEscrowRow,
  ] = await Promise.all([
    getProviderStats(provider.id, provider.userId),
    db
      .select({
        id: quotes.id,
        description: quotes.description,
        vehicleInfo: quotes.vehicleInfo,
        createdAt: quotes.createdAt,
        ownerName: profiles.displayName,
      })
      .from(quotes)
      .leftJoin(profiles, eq(profiles.userId, quotes.ownerId))
      .where(and(eq(quotes.providerUserId, provider.userId), eq(quotes.status, "requested")))
      .orderBy(desc(quotes.createdAt)),
    db
      .select({
        id: payments.id,
        mode: payments.mode,
        escrowStatus: payments.escrowStatus,
        amountCents: payments.amountCents,
        createdAt: payments.createdAt,
        jobDescription: quotes.description,
        ownerName: profiles.displayName,
      })
      .from(payments)
      .leftJoin(jobs, eq(jobs.id, payments.jobId))
      .leftJoin(quotes, eq(quotes.id, jobs.quoteId))
      .leftJoin(profiles, eq(profiles.userId, payments.ownerId))
      .where(eq(payments.providerUserId, provider.userId))
      .orderBy(desc(payments.createdAt))
      .limit(5),
    db
      .select({
        id: jobs.id,
        status: jobs.status,
        scheduledAt: jobs.scheduledAt,
        ownerName: profiles.displayName,
        jobDescription: quotes.description,
      })
      .from(jobs)
      .leftJoin(quotes, eq(quotes.id, jobs.quoteId))
      .leftJoin(profiles, eq(profiles.userId, jobs.ownerId))
      .where(
        and(
          eq(jobs.providerUserId, provider.userId),
          gte(jobs.scheduledAt, weekStart),
          lte(jobs.scheduledAt, weekEnd),
        ),
      )
      .orderBy(jobs.scheduledAt),
    db.select().from(verificationRecords).where(eq(verificationRecords.providerId, provider.id)),
    getWeeklyLeadCounts(provider.userId),
    db.select().from(providerCategories).where(eq(providerCategories.providerId, provider.id)).limit(1),
    db
      .select()
      .from(providerServiceOfferings)
      .where(eq(providerServiceOfferings.providerId, provider.id))
      .limit(1),
    db
      .select()
      .from(providerGalleryPhotos)
      .where(and(eq(providerGalleryPhotos.providerId, provider.id), eq(providerGalleryPhotos.status, "approved")))
      .limit(1),
    db.select({ rating: reviews.rating }).from(reviews).where(eq(reviews.providerId, provider.id)),
    db
      .select({ total: sql<string | null>`sum(${payments.amountCents})` })
      .from(payments)
      .where(and(eq(payments.providerUserId, provider.userId), eq(payments.escrowStatus, "authorized"))),
  ]);

  const pendingEscrowCents = Number(pendingEscrowRow[0]?.total ?? 0);

  const reviewBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: recentReviewRatings.filter((r) => r.rating === star).length,
  }));
  const maxReviewCount = Math.max(1, ...reviewBreakdown.map((b) => b.count));

  const completeness = getProfileCompleteness({
    hasBio: !!provider.bio,
    hasCategory: categoryRows.length > 0,
    hasServiceOffering: offeringRows.length > 0,
    hasHourlyRate: !!provider.hourlyRateCents,
    hasApprovedPhoto: approvedPhotoRows.length > 0,
  });

  const today = new Date();
  const bookedDays = new Set(weekJobs.map((j) => new Date(j.scheduledAt).getDate()));

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="home-serif" style={{ fontSize: 28 }}>
            Good {greetingPeriod()}, {session.user.name.split(" ")[0]}
          </h1>
          <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
            Here&apos;s what&apos;s happening across your leads and jobs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={provider.isListable ? "success" : "neutral"}>
            {provider.isListable ? "Profile live · visible in search" : "Profile not listed yet"}
          </Badge>
          <form action={toggleAcceptingLeads}>
            <input type="hidden" name="next" value={String(!provider.acceptingLeads)} />
            <button type="submit" style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}>
              <Badge tone={provider.acceptingLeads ? "success" : "danger"}>
                {provider.acceptingLeads ? "Accepting new leads" : "Not accepting leads"}
              </Badge>
            </button>
          </form>
        </div>
      </div>

      {completeness.percent < 100 ? (
        <Card className="flex flex-wrap items-center gap-5">
          <Gauge value={completeness.percent / 100} size={64} centerValue={`${completeness.percent}%`} />
          <div className="flex-1">
            <p className="home-serif" style={{ fontSize: 16 }}>
              Your profile is {completeness.percent}% complete
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--home-text-muted)" }}>
              Complete profiles get more leads. Finish these to get fully listed:
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {completeness.missing.map((m) => (
                <li key={m.label}>
                  <Link href={m.href} className="home-badge home-badge-neutral">
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Rating"
          value={provider.ratingAvg ? Number(provider.ratingAvg).toFixed(1) : "—"}
          delta={`${provider.ratingCount} reviews`}
          gauge={provider.ratingAvg ? Number(provider.ratingAvg) / 5 : 0}
        />
        <StatCard
          label="Quote win rate"
          value={stats.quoteWinRate !== null ? `${Math.round(stats.quoteWinRate * 100)}%` : "—"}
          delta="Accepted vs. declined"
          gauge={stats.quoteWinRate ?? 0}
        />
        <StatCard
          label="Avg. response"
          value={stats.avgResponseMinutes !== null ? `${stats.avgResponseMinutes}m` : "—"}
          delta="Time to first quote"
          gauge={stats.avgResponseMinutes !== null ? Math.max(0, 1 - stats.avgResponseMinutes / 240) : 0}
        />
        <StatCard
          label="This month"
          value={`$${(stats.monthEarningsCents / 100).toFixed(0)}`}
          delta={`${weekJobs.filter((j) => j.status === "completed").length} jobs this week`}
          gauge={Math.min(1, stats.monthEarningsCents / 500000)}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-5">
          <Card>
            <h2 className="home-serif" style={{ fontSize: 18, marginBottom: 16 }}>
              Incoming leads
            </h2>
            {leads.length === 0 ? (
              <EmptyState>No new leads right now.</EmptyState>
            ) : (
              <div className="flex flex-col">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex gap-3.5 py-4 last:pb-0"
                    style={{ borderBottom: "1px solid var(--home-line)" }}
                  >
                    <div
                      className="h-10 w-10 flex-shrink-0 rounded-lg"
                      style={{ background: "var(--home-tint)" }}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-bold">
                        {lead.ownerName ?? "Tovant owner"}
                        {isRecent(lead.createdAt) ? (
                          <span className="home-badge home-badge-success" style={{ marginLeft: 8 }}>
                            New
                          </span>
                        ) : null}
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
                      >
                        {vehicleSummary(lead.vehicleInfo)} · requested {timeAgo(lead.createdAt)}
                      </div>
                      <p className="mt-1.5 text-[13.5px] leading-6" style={{ color: "var(--home-text-muted)" }}>
                        &ldquo;{lead.description}&rdquo;
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <form action={sendQuote} className="flex items-center gap-2">
                          <input type="hidden" name="quoteId" value={lead.id} />
                          <Input
                            type="number"
                            name="amount"
                            step="0.01"
                            min="1"
                            required
                            placeholder="$"
                            style={{ width: 90, fontSize: 13 }}
                          />
                          <select name="paymentMode" defaultValue="off_platform" className="home-select" style={{ fontSize: 13 }}>
                            <option value="off_platform">Off-platform</option>
                            <option value="in_app">In-app escrow</option>
                          </select>
                          <Button type="submit" style={{ padding: "9px 16px", fontSize: 13 }}>
                            Send quote
                          </Button>
                        </form>
                        <Button
                          href={`/provider/messages?quoteId=${lead.id}`}
                          variant="ghost"
                          style={{ padding: "9px 16px", fontSize: 13 }}
                        >
                          Message
                        </Button>
                        <form action={declineQuote}>
                          <input type="hidden" name="quoteId" value={lead.id} />
                          <Button type="submit" variant="ghost" style={{ padding: "9px 16px", fontSize: 13 }}>
                            Decline
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <h2 className="home-serif" style={{ fontSize: 18 }}>
                Earnings
              </h2>
              <a href="/provider/earnings" style={{ fontSize: 13, color: "var(--home-accent)" }}>
                Full history →
              </a>
            </div>
            {recentPayments.length === 0 ? (
              <EmptyState>No payments yet.</EmptyState>
            ) : (
              <Table>
                <TableHead>
                  <th>Job</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </TableHead>
                <TableBody>
                  {recentPayments.map((p) => (
                    <TableRow key={p.id}>
                      <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.jobDescription ?? "—"}
                      </td>
                      <td>{p.ownerName ?? "Tovant owner"}</td>
                      <td>
                        <Badge tone={p.escrowStatus === "released" ? "success" : "warning"}>
                          {p.mode === "in_app" ? p.escrowStatus.replace("_", " ") : "off-platform"}
                        </Badge>
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--home-font-mono)" }}>
                        {p.amountCents ? `$${(p.amountCents / 100).toFixed(2)}` : "—"}
                      </td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div
              className="mt-4 flex items-center justify-between"
              style={{ borderRadius: 14, border: "1px solid var(--home-line)", background: "var(--home-tint)", padding: "16px 20px" }}
            >
              <div>
                <p className="home-field-label">Pending escrow release</p>
                <p style={{ fontFamily: "var(--home-font-mono)", fontSize: 20, fontWeight: 600, marginTop: 4 }}>
                  ${(pendingEscrowCents / 100).toFixed(2)}
                </p>
              </div>
              <Button href="/api/provider/earnings/export" variant="ghost" style={{ padding: "9px 16px", fontSize: 13 }}>
                Export CSV
              </Button>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <h2 className="home-serif" style={{ fontSize: 18 }}>
                This week
              </h2>
              <a href="/provider/calendar" style={{ fontSize: 13, color: "var(--home-accent)" }}>
                Open calendar →
              </a>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[10px]"
                  style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
                >
                  {d}
                </div>
              ))}
              {Array.from({ length: 7 }, (_, i) => {
                const day = new Date(weekStart);
                day.setDate(day.getDate() + i);
                const isToday = day.toDateString() === today.toDateString();
                const isBooked = bookedDays.has(day.getDate());
                return (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center text-xs"
                    style={{
                      borderRadius: 10,
                      fontFamily: "var(--home-font-mono)",
                      border: isToday ? "1px solid var(--home-accent)" : "1px solid transparent",
                      color: isToday ? "var(--home-accent)" : isBooked ? "var(--home-text)" : "var(--home-text-muted)",
                      fontWeight: isToday ? 700 : 400,
                      background: isBooked && !isToday ? "var(--home-tint)" : "var(--home-surface)",
                    }}
                  >
                    {day.getDate()}
                  </div>
                );
              })}
            </div>
            {weekJobs.length > 0 ? (
              <div className="mt-4 flex flex-col gap-2.5">
                {weekJobs.slice(0, 4).map((j) => (
                  <div key={j.id} className="flex justify-between gap-3 text-[13px]">
                    <span className="flex-shrink-0" style={{ color: "var(--home-text-muted)" }}>
                      {new Date(j.scheduledAt).toLocaleDateString(undefined, { weekday: "short" })},{" "}
                      {new Date(j.scheduledAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </span>
                    <span className="truncate text-right">
                      {j.ownerName ?? "Tovant owner"}
                      {j.jobDescription ? ` — ${j.jobDescription}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          <Card>
            <h2 className="home-serif" style={{ fontSize: 18, marginBottom: 16 }}>
              Insights
            </h2>
            <div>
              <p className="home-field-label">Profile views</p>
              <p style={{ fontFamily: "var(--home-font-mono)", fontSize: 20, fontWeight: 600, marginTop: 4 }}>
                {provider.profileViewCount}
              </p>
            </div>
            <p className="home-field-label" style={{ marginTop: 16, marginBottom: 8 }}>
              Leads per week
            </p>
            <div className="flex h-16 items-end gap-1.5">
              {weeklyLeadCounts.map((n, i) => {
                const max = Math.max(1, ...weeklyLeadCounts);
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      style={{
                        width: "100%",
                        borderRadius: "4px 4px 0 0",
                        background: "var(--home-accent-soft)",
                        height: `${Math.max(4, (n / max) * 100)}%`,
                      }}
                    />
                    <span className="text-[9px]" style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}>
                      {n}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <h2 className="home-serif" style={{ fontSize: 18 }}>
                Reviews
              </h2>
              <a href="/provider/reviews" style={{ fontSize: 13, color: "var(--home-accent)" }}>
                View all →
              </a>
            </div>
            {recentReviewRatings.length === 0 ? (
              <EmptyState>No reviews yet.</EmptyState>
            ) : (
              <div className="flex flex-col gap-1.5">
                {reviewBreakdown.map((b) => (
                  <div key={b.star} className="flex items-center gap-2">
                    <span
                      className="w-8 text-[10.5px]"
                      style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
                    >
                      {b.star}/5
                    </span>
                    <div className="h-1.5 flex-1 rounded-full" style={{ background: "var(--home-tint)" }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${(b.count / maxReviewCount) * 100}%`, background: "var(--home-accent)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="home-serif" style={{ fontSize: 18, marginBottom: 16 }}>
              Verification status
            </h2>
            {verifications.length === 0 ? (
              <EmptyState>No verification records yet.</EmptyState>
            ) : (
              <div className="flex flex-col gap-3">
                {verifications.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-[13.5px]">
                    <span>{VERIFICATION_LABEL[v.type] ?? v.type}</span>
                    <Badge tone={v.status === "approved" ? "success" : "neutral"}>
                      {v.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  gauge,
}: {
  label: string;
  value: string;
  delta: string;
  gauge: number;
}) {
  return (
    <Card className="flex items-center gap-4">
      <Gauge value={gauge} size={58} centerValue={value} />
      <div>
        <p className="home-field-label">{label}</p>
        <p style={{ fontFamily: "var(--home-font-mono)", fontSize: 20, fontWeight: 600 }}>{value}</p>
        <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--home-success)" }}>
          {delta}
        </p>
      </div>
    </Card>
  );
}

function greetingPeriod() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function timeAgo(date: Date) {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function isRecent(date: Date) {
  return Date.now() - new Date(date).getTime() < 60 * 60 * 1000;
}

function vehicleSummary(vehicleInfo: unknown) {
  if (!vehicleInfo || typeof vehicleInfo !== "object") return "Vehicle not specified";
  const v = vehicleInfo as { year?: number; make?: string; model?: string };
  return [v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle not specified";
}
