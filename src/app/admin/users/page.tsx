import Link from "next/link";
import { desc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { banUserAction, unbanUserAction } from "./actions";

const PAGE_SIZE = 25;

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  provider: "Provider",
  admin: "Admin",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const query = (q ?? "").trim();
  const page = Math.max(1, Number(pageParam) || 1);

  const rows = await db
    .select()
    .from(user)
    .where(query ? or(ilike(user.name, `%${query}%`), ilike(user.email, `%${query}%`)) : undefined)
    .orderBy(desc(user.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);

  const hasNextPage = rows.length > PAGE_SIZE;
  const pageUsers = rows.slice(0, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Users
        </h1>
        <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
          Search, review, and ban/unban accounts.
        </p>
      </div>

      <form method="GET" className="flex max-w-sm gap-2">
        <Input type="text" name="q" defaultValue={query} placeholder="Search name or email" />
        <Button type="submit" variant="ghost" style={{ padding: "10px 16px", fontSize: 13 }}>
          Search
        </Button>
      </form>

      {pageUsers.length === 0 ? (
        <EmptyState>No users found.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {pageUsers.map((u) => (
            <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link href={`/admin/users/${u.id}`} className="text-sm font-semibold hover:underline">
                  {u.name}
                </Link>
                <p className="text-xs" style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}>
                  {u.email}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className="text-[11px] uppercase tracking-widest"
                  style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
                >
                  {ROLE_LABEL[u.role] ?? u.role}
                </span>
                {u.banned ? (
                  <div className="flex items-center gap-2">
                    <Badge tone="danger">Banned</Badge>
                    <form action={unbanUserAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <Button type="submit" variant="ghost" style={{ padding: "9px 16px", fontSize: 13 }}>
                        Unban
                      </Button>
                    </form>
                  </div>
                ) : (
                  <form action={banUserAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <Input type="text" name="reason" placeholder="Reason (optional)" style={{ fontSize: 13 }} />
                    <Button type="submit" variant="ghost" style={{ padding: "9px 16px", fontSize: 13 }}>
                      Ban
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          ))}
        </ul>
      )}

      {(page > 1 || hasNextPage) && (
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              href={`/admin/users?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(page - 1) })}`}
              className="home-btn home-btn-ghost"
              style={{ padding: "9px 16px", fontSize: 13 }}
            >
              Previous
            </Link>
          ) : null}
          {hasNextPage ? (
            <Link
              href={`/admin/users?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(page + 1) })}`}
              className="home-btn home-btn-ghost"
              style={{ padding: "9px 16px", fontSize: 13 }}
            >
              Next
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
