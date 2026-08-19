import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, subscriptions, providerProfiles } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ProviderEarningsPage() {
  const session = await getSession();

  const provider = session
    ? await db.query.providerProfiles.findFirst({
        where: eq(providerProfiles.userId, session.user.id),
      })
    : null;

  const [providerPayments, subscription] = provider
    ? await Promise.all([
        db.select().from(payments).where(eq(payments.providerId, provider.id)),
        db.query.subscriptions.findFirst({
          where: eq(subscriptions.providerId, provider.id),
        }),
      ])
    : [[], null];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Earnings &amp; payouts
        </h1>
        <Button href="/api/provider/earnings/export" variant="ghost" style={{ padding: "9px 16px", fontSize: 13 }}>
          Export CSV
        </Button>
      </div>

      <section className="mt-6">
        <p className="home-field-label" style={{ marginBottom: 8 }}>
          Subscription
        </p>
        <p className="text-sm">{subscription ? subscription.status : "No active subscription"}</p>
      </section>

      <section className="mt-6">
        <p className="home-field-label" style={{ marginBottom: 8 }}>
          Job payments
        </p>
        {providerPayments.length === 0 ? (
          <EmptyState>No payments yet.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {providerPayments.map((p) => (
              <li key={p.id} className="home-card flex items-center justify-between" style={{ padding: 14 }}>
                <Badge tone={p.escrowStatus === "released" ? "success" : "neutral"}>
                  {p.mode === "in_app" ? p.escrowStatus.replace("_", " ") : "off-platform"}
                </Badge>
                <span style={{ fontFamily: "var(--home-font-mono)" }}>
                  {p.amountCents ? `$${(p.amountCents / 100).toFixed(2)}` : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
