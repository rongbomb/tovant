import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  providerProfiles,
  verificationRecords,
  disputes,
  jobs,
  payments,
  leadCharges,
  auditLog,
  user,
} from "@/db/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const OPEN_DISPUTE_STATUSES = ["open", "under_review"] as const;
const PENDING_VERIFICATION_STATUSES = ["pending", "in_review"] as const;

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-xs uppercase tracking-widest" style={{ color: "var(--home-text-muted)" }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--home-font-mono)", fontSize: 28, fontWeight: 600 }}>{value}</p>
      {sub ? <p className="text-xs" style={{ color: "var(--home-text-muted)" }}>{sub}</p> : null}
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [
    listableProviders,
    pendingVerifications,
    openDisputes,
    jobsByStatus,
    heldEscrow,
    leadRevenue,
    recentAudit,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(providerProfiles)
      .where(eq(providerProfiles.isListable, true)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(verificationRecords)
      .where(inArray(verificationRecords.status, [...PENDING_VERIFICATION_STATUSES])),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(disputes)
      .where(inArray(disputes.status, [...OPEN_DISPUTE_STATUSES])),
    db
      .select({ status: jobs.status, count: sql<number>`count(*)::int` })
      .from(jobs)
      .groupBy(jobs.status),
    db
      .select({ total: sql<number>`coalesce(sum(${payments.amountCents}), 0)::int` })
      .from(payments)
      .where(inArray(payments.escrowStatus, ["authorized", "captured"])),
    db
      .select({ total: sql<number>`coalesce(sum(${leadCharges.amountCents}), 0)::int` })
      .from(leadCharges)
      .where(and(eq(leadCharges.status, "charged"), gte(leadCharges.createdAt, thirtyDaysAgo))),
    db
      .select({ log: auditLog, actorName: user.name })
      .from(auditLog)
      .leftJoin(user, eq(user.id, auditLog.actorUserId))
      .orderBy(sql`${auditLog.createdAt} desc`)
      .limit(8),
  ]);

  const jobsByStatusMap = new Map(jobsByStatus.map((r) => [r.status, r.count]));
  const activeJobs =
    (jobsByStatusMap.get("scheduled") ?? 0) +
    (jobsByStatusMap.get("confirmed") ?? 0) +
    (jobsByStatusMap.get("in_progress") ?? 0);

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Admin dashboard
        </h1>
        <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
          Operational snapshot across verification, jobs, escrow, and disputes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Listable providers" value={String(listableProviders[0]?.count ?? 0)} />
        <StatTile
          label="Pending verification"
          value={String(pendingVerifications[0]?.count ?? 0)}
          sub="records awaiting review"
        />
        <StatTile
          label="Open disputes"
          value={String(openDisputes[0]?.count ?? 0)}
          sub={openDisputes[0]?.count ? "needs attention" : undefined}
        />
        <StatTile label="Active jobs" value={String(activeJobs)} sub="scheduled + confirmed + in progress" />
        <StatTile
          label="Escrow currently held"
          value={`$${((heldEscrow[0]?.total ?? 0) / 100).toFixed(2)}`}
          sub="authorized + captured, not yet released"
        />
        <StatTile
          label="Lead revenue (30d)"
          value={`$${((leadRevenue[0]?.total ?? 0) / 100).toFixed(2)}`}
        />
        <StatTile label="Completed jobs" value={String(jobsByStatusMap.get("completed") ?? 0)} />
        <StatTile label="Cancelled jobs" value={String(jobsByStatusMap.get("cancelled") ?? 0)} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="home-serif" style={{ fontSize: 18 }}>
            Recent admin activity
          </h2>
          <a href="/admin/audit-log" className="text-sm" style={{ color: "var(--home-accent)" }}>
            View full audit log →
          </a>
        </div>
        {recentAudit.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--home-text-muted)" }}>Nothing logged yet.</p>
        ) : (
          <Card className="flex flex-col gap-0" style={{ padding: 0 }}>
            {recentAudit.map(({ log, actorName }, i) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3"
                style={{
                  padding: "12px 16px",
                  borderBottom: i < recentAudit.length - 1 ? "1px solid var(--home-line)" : "none",
                }}
              >
                <div>
                  <p className="text-sm font-semibold">{log.action}</p>
                  <p className="text-xs" style={{ color: "var(--home-text-muted)" }}>
                    {actorName ?? "Unknown"} · {log.targetType} {log.targetId.slice(0, 8)}
                  </p>
                </div>
                <Badge tone="neutral">{new Date(log.createdAt).toLocaleDateString()}</Badge>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
