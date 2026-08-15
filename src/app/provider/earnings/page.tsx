import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, subscriptions, providerProfiles } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";

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
      <h1 className="font-display text-2xl uppercase tracking-widest text-ash">
        Earnings &amp; payouts
      </h1>

      <section className="mt-6">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-steel">
          Subscription
        </p>
        <p className="text-ash">
          {subscription ? subscription.status : "No active subscription"}
        </p>
      </section>

      <section className="mt-6">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-steel">
          Job payments
        </p>
        {providerPayments.length === 0 ? (
          <p className="text-steel">No payments yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {providerPayments.map((p) => (
              <li
                key={p.id}
                className="flex justify-between rounded border border-steel/40 bg-graphite p-3"
              >
                <span className="text-ash">
                  {p.mode === "in_app" ? p.escrowStatus : "off-platform"}
                </span>
                <span className="font-mono text-ash">
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
