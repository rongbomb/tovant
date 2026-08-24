import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { disputes, jobs, payments, providerProfiles, profiles } from "@/db/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHead, TableBody, TableRow } from "@/components/ui/table";
import { resolveDispute } from "./actions";

const OPEN_STATUSES = ["open", "under_review"] as const;

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  open: "warning",
  under_review: "warning",
  resolved_provider: "success",
  resolved_owner: "neutral",
  resolved_split: "success",
  closed: "neutral",
};

export default async function AdminDisputesPage() {
  const rows = await db
    .select({
      dispute: disputes,
      job: jobs,
      payment: payments,
      providerBusinessName: providerProfiles.businessName,
    })
    .from(disputes)
    .innerJoin(jobs, eq(jobs.id, disputes.jobId))
    .leftJoin(payments, eq(payments.jobId, disputes.jobId))
    .leftJoin(providerProfiles, eq(providerProfiles.id, disputes.providerId))
    .orderBy(desc(disputes.createdAt));

  const ownerIds = rows.map((r) => r.dispute.ownerId);
  const ownerProfiles = ownerIds.length
    ? await db.select().from(profiles).where(inArray(profiles.userId, ownerIds))
    : [];
  const ownerNameById = new Map(ownerProfiles.map((p) => [p.userId, p.displayName]));

  const open = rows.filter((r) => (OPEN_STATUSES as readonly string[]).includes(r.dispute.status));
  const resolved = rows.filter((r) => !(OPEN_STATUSES as readonly string[]).includes(r.dispute.status));

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Disputes
        </h1>
        <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
          {open.length} open, {resolved.length} resolved.
        </p>
      </div>

      {open.length === 0 ? (
        <EmptyState>No open disputes.</EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {open.map(({ dispute, job, payment, providerBusinessName }) => (
            <Card key={dispute.id} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {ownerNameById.get(dispute.ownerId) ?? "Owner"} vs.{" "}
                    {providerBusinessName ?? "Provider"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--home-text-muted)", fontFamily: "var(--home-font-mono)" }}>
                    Job {job.id.slice(0, 8)} · opened {new Date(dispute.createdAt).toLocaleDateString()}
                    {payment?.amountCents ? ` · $${(payment.amountCents / 100).toFixed(2)}` : ""}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[dispute.status]}>{dispute.status.replace("_", " ")}</Badge>
              </div>

              <p className="text-sm">{dispute.reason}</p>

              <form action={resolveDispute} className="flex flex-wrap items-end gap-3" style={{ borderTop: "1px solid var(--home-line)", paddingTop: 16 }}>
                <input type="hidden" name="disputeId" value={dispute.id} />
                <div className="flex-1" style={{ minWidth: 220 }}>
                  <Input label="Resolution notes" type="text" name="notes" placeholder="Why this outcome" />
                </div>
                {payment?.mode === "in_app" ? (
                  <div style={{ minWidth: 140 }}>
                    <Input
                      label="Split to provider ($)"
                      type="number"
                      name="splitToProviderDollars"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" name="resolution" value="release" style={{ padding: "9px 14px", fontSize: 12 }}>
                    Release to provider
                  </Button>
                  <Button type="submit" name="resolution" value="refund" variant="ghost" style={{ padding: "9px 14px", fontSize: 12 }}>
                    Refund owner
                  </Button>
                  {payment?.mode === "in_app" ? (
                    <Button type="submit" name="resolution" value="split" variant="ghost" style={{ padding: "9px 14px", fontSize: 12 }}>
                      Split
                    </Button>
                  ) : null}
                  <Button type="submit" name="resolution" value="close" variant="ghost" style={{ padding: "9px 14px", fontSize: 12 }}>
                    Close (no action)
                  </Button>
                </div>
              </form>
            </Card>
          ))}
        </div>
      )}

      {resolved.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="home-serif" style={{ fontSize: 18 }}>
            Resolved
          </h2>
          <Table>
            <TableHead>
              <th>Parties</th>
              <th>Resolution</th>
              <th>Notes</th>
              <th>Resolved</th>
            </TableHead>
            <TableBody>
              {resolved.map(({ dispute, providerBusinessName }) => (
                <TableRow key={dispute.id}>
                  <td>
                    {ownerNameById.get(dispute.ownerId) ?? "Owner"} vs. {providerBusinessName ?? "Provider"}
                  </td>
                  <td><Badge tone={STATUS_TONE[dispute.status]}>{dispute.status.replace("_", " ")}</Badge></td>
                  <td className="text-sm">{dispute.resolutionNotes ?? "—"}</td>
                  <td className="text-sm">{dispute.resolvedAt ? new Date(dispute.resolvedAt).toLocaleDateString() : "—"}</td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
