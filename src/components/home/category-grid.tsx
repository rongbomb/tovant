import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { providerCategoryTypes, providerCategories, providerProfiles } from "@/db/schema";

const ICONS: Record<string, React.ReactNode> = {
  mechanic: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
      <path d="M7 17h10M6 17a2 2 0 100-4 2 2 0 000 4zm12 0a2 2 0 100-4 2 2 0 000 4zM5 13l1.5-5A2 2 0 018.4 6.5h7.2a2 2 0 011.9 1.5L19 13" />
    </svg>
  ),
  detailer: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
      <path d="M4 11l1-5h14l1 5M4 11v7a1 1 0 001 1h1a1 1 0 001-1v-1h10v1a1 1 0 001 1h1a1 1 0 001-1v-7M4 11h16" />
    </svg>
  ),
  upgrades_fabrication: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
      <path d="M6 18L18 6M14 4l2 2M18 8l2 2M4 14l2 2M9 19l-2-2M4 9l1 1M15 20l1-1" />
      <circle cx="6" cy="6" r="1.6" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </svg>
);

export async function CategoryGrid() {
  const [categories, counts] = await Promise.all([
    db
      .select()
      .from(providerCategoryTypes)
      .where(eq(providerCategoryTypes.active, true))
      .orderBy(asc(providerCategoryTypes.sortOrder)),
    db
      .select({ category: providerCategories.category, count: sql<number>`count(*)::int` })
      .from(providerCategories)
      .innerJoin(providerProfiles, eq(providerProfiles.id, providerCategories.providerId))
      .where(eq(providerProfiles.isListable, true))
      .groupBy(providerCategories.category),
  ]);
  const countByCategory = new Map(counts.map((c) => [c.category, c.count]));

  return (
    <section id="categories">
      <div className="home-container">
        <div className="home-section-head">
          <div>
            <p className="home-eyebrow">What you need, handled</p>
            <h2 className="home-serif" style={{ marginTop: 8 }}>Pick a category to get started</h2>
          </div>
        </div>
        <div className="home-cat-grid">
          {categories.map((cat) =>
            cat.comingSoon ? (
              <div
                key={cat.id}
                className="home-cat-card"
                style={{ opacity: 0.6, cursor: "default" }}
                aria-disabled="true"
              >
                <div className="home-icon-chip">{ICONS[cat.id] ?? DEFAULT_ICON}</div>
                <div>
                  <h3>{cat.label}</h3>
                  <span className="home-badge home-badge-neutral" style={{ marginTop: 5 }}>
                    Coming soon
                  </span>
                </div>
              </div>
            ) : (
              <Link className="home-cat-card" key={cat.id} href="/discover">
                <div className="home-icon-chip">{ICONS[cat.id] ?? DEFAULT_ICON}</div>
                <div>
                  <h3>{cat.label}</h3>
                  <p className="home-count">
                    {(() => {
                      const n = countByCategory.get(cat.id) ?? 0;
                      return n === 0 ? "New to the pilot market" : `${n} verified ${n === 1 ? "pro" : "pros"}`;
                    })()}
                  </p>
                </div>
              </Link>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
