import Link from "next/link";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { providerProfiles, verificationRecords } from "@/db/schema";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AdminProvidersPage() {
  const pendingProviderIds = await db
    .selectDistinct({ providerId: verificationRecords.providerId })
    .from(verificationRecords)
    .where(inArray(verificationRecords.status, ["pending", "in_review"]));

  const ids = pendingProviderIds.map((r) => r.providerId);

  const providers = ids.length
    ? await db.select().from(providerProfiles).where(inArray(providerProfiles.id, ids))
    : [];

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Verification queue
        </h1>
        <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
          Providers with at least one document awaiting review.
        </p>
      </div>

      {providers.length === 0 ? (
        <EmptyState>Nothing pending review.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {providers.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/providers/${p.id}`} className="home-card flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{p.businessName ?? "Unnamed provider"}</p>
                  <p
                    className="text-xs uppercase tracking-widest"
                    style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
                  >
                    {p.overallVerificationStatus.replace("_", " ")}
                  </p>
                </div>
                <span
                  className="text-xs uppercase tracking-widest"
                  style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-accent)" }}
                >
                  Review →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
