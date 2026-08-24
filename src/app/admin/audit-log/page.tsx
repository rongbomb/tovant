import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLog, user } from "@/db/schema";
import { Table, TableHead, TableBody, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

const PAGE_SIZE = 50;

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);

  const rows = await db
    .select({ log: auditLog, actorName: user.name, actorEmail: user.email })
    .from(auditLog)
    .leftJoin(user, eq(user.id, auditLog.actorUserId))
    .orderBy(desc(auditLog.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);

  const hasNextPage = rows.length > PAGE_SIZE;
  const pageRows = rows.slice(0, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Audit log
        </h1>
        <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
          Append-only record of every admin action touching money or verification status.
        </p>
      </div>

      {pageRows.length === 0 ? (
        <EmptyState>No audit log entries yet.</EmptyState>
      ) : (
        <>
          <Table>
            <TableHead>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Metadata</th>
            </TableHead>
            <TableBody>
              {pageRows.map(({ log, actorName, actorEmail }) => (
                <TableRow key={log.id}>
                  <td className="text-sm" style={{ whiteSpace: "nowrap" }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="text-sm">{actorName ?? actorEmail ?? "Unknown"}</td>
                  <td className="text-sm" style={{ fontFamily: "var(--home-font-mono)" }}>{log.action}</td>
                  <td className="text-sm">
                    {log.targetType} <span style={{ color: "var(--home-text-muted)" }}>{log.targetId.slice(0, 8)}</span>
                  </td>
                  <td className="text-xs" style={{ color: "var(--home-text-muted)", maxWidth: 280 }}>
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </td>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            {page > 1 ? (
              <a href={`/admin/audit-log?page=${page - 1}`} className="home-btn home-btn-ghost">
                ← Newer
              </a>
            ) : <span />}
            {hasNextPage ? (
              <a href={`/admin/audit-log?page=${page + 1}`} className="home-btn home-btn-ghost">
                Older →
              </a>
            ) : <span />}
          </div>
        </>
      )}
    </div>
  );
}
