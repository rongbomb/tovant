import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { providerProfiles, reviews, profiles } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { RatingBars } from "@/components/ui/rating-bars";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ProviderReviewsPage() {
  const session = await getSession();
  if (!session) return null;

  const provider = await db.query.providerProfiles.findFirst({
    where: eq(providerProfiles.userId, session.user.id),
  });
  if (!provider) {
    return (
      <div className="p-8">
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Reviews
        </h1>
      </div>
    );
  }

  const reviewRows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      reviewerName: profiles.displayName,
    })
    .from(reviews)
    .leftJoin(profiles, eq(profiles.userId, reviews.ownerId))
    .where(eq(reviews.providerId, provider.id))
    .orderBy(desc(reviews.createdAt));

  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviewRows.filter((r) => r.rating === star).length,
  }));
  const maxCount = Math.max(1, ...breakdown.map((b) => b.count));

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Reviews ({reviewRows.length})
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--home-text-muted)" }}>
          {provider.ratingAvg ? `${Number(provider.ratingAvg).toFixed(1)} average` : "No rating yet"}
        </p>
      </div>

      <Card>
        <h2 className="home-serif" style={{ fontSize: 18, marginBottom: 16 }}>
          Breakdown
        </h2>
        <div className="flex flex-col gap-2">
          {breakdown.map((b) => (
            <div key={b.star} className="flex items-center gap-3">
              <span className="w-10 text-xs" style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}>
                {b.star} star
              </span>
              <div className="h-2 flex-1 rounded-full" style={{ background: "var(--home-tint)" }}>
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${(b.count / maxCount) * 100}%`, background: "var(--home-accent)" }}
                />
              </div>
              <span
                className="w-6 text-right text-xs"
                style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
              >
                {b.count}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <section className="flex flex-col">
        {reviewRows.length === 0 ? (
          <EmptyState>No reviews yet.</EmptyState>
        ) : (
          reviewRows.map((r) => (
            <div
              key={r.id}
              className="flex gap-4 py-5 last:pb-0"
              style={{ borderBottom: "1px solid var(--home-line)" }}
            >
              <div className="h-10 w-10 flex-shrink-0 rounded-lg" style={{ background: "var(--home-tint)" }} />
              <div>
                <div className="text-sm font-bold">{r.reviewerName ?? "Tovant owner"}</div>
                <div className="text-[11px]" style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
                <div className="mt-1.5">
                  <RatingBars value={r.rating} />
                </div>
                <p className="mt-2 text-sm leading-6">{r.comment}</p>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
