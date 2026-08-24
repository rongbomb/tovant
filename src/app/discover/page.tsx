import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  providerProfiles,
  providerCategories,
  providerCategoryTypes,
  providerSpecialties,
  providerSpecialtyTypes,
  providerServiceOfferings,
  profiles,
} from "@/db/schema";
import { getServiceOfferingLabelMap } from "@/lib/service-offerings";
import { getCategoryLabelMap } from "@/lib/taxonomy-labels";
import { PublicHeader } from "@/components/home/public-header";
import { DiscoverResults, type DiscoverProvider } from "@/components/discover/discover-results";
import { EmptyState } from "@/components/ui/empty-state";

// Provider listings change as providers verify/list/delist — a plain
// Drizzle query gives Next no fetch-cache signal to detect that, so
// without this the page would statically cache the DB state from
// whichever build last ran.
export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; near?: string }>;
}) {
  const { category: initialCategory, near: initialNear } = await searchParams;

  const rows = await db
    .select({
      id: providerProfiles.id,
      businessName: providerProfiles.businessName,
      bio: providerProfiles.bio,
      serviceMode: providerProfiles.serviceMode,
      ratingAvg: providerProfiles.ratingAvg,
      ratingCount: providerProfiles.ratingCount,
      shopCity: providerProfiles.shopCity,
      lat: profiles.lat,
      lng: profiles.lng,
    })
    .from(providerProfiles)
    .leftJoin(profiles, eq(profiles.userId, providerProfiles.userId))
    .where(eq(providerProfiles.isListable, true));

  const [
    categoryRows,
    categoryTypeRows,
    specialtyTypeRows,
    specialtyRows,
    offeringRows,
    offeringLabels,
  ] = await Promise.all([
    db.select().from(providerCategories),
    db
      .select()
      .from(providerCategoryTypes)
      .where(and(eq(providerCategoryTypes.active, true), eq(providerCategoryTypes.comingSoon, false)))
      .orderBy(asc(providerCategoryTypes.sortOrder)),
    db
      .select()
      .from(providerSpecialtyTypes)
      .where(eq(providerSpecialtyTypes.active, true))
      .orderBy(asc(providerSpecialtyTypes.sortOrder)),
    db.select().from(providerSpecialties),
    db.select().from(providerServiceOfferings),
    getServiceOfferingLabelMap(),
  ]);
  const categoryLabels = await getCategoryLabelMap();

  const categoryOptions = [
    { value: "all", label: "All categories" },
    ...categoryTypeRows.map((c) => ({ value: c.id, label: c.label })),
  ];
  const specialtyOptions = specialtyTypeRows.map((s) => ({ value: s.id, label: s.label }));

  const categoriesByProvider = new Map<string, string[]>();
  for (const c of categoryRows) {
    const list = categoriesByProvider.get(c.providerId) ?? [];
    list.push(c.category);
    categoriesByProvider.set(c.providerId, list);
  }
  const specialtiesByProvider = new Map<string, string[]>();
  for (const s of specialtyRows) {
    const list = specialtiesByProvider.get(s.providerId) ?? [];
    list.push(s.specialty);
    specialtiesByProvider.set(s.providerId, list);
  }
  const offeringLabelsByProvider = new Map<string, string[]>();
  for (const o of offeringRows) {
    const list = offeringLabelsByProvider.get(o.providerId) ?? [];
    list.push(offeringLabels[o.offering] ?? o.offering);
    offeringLabelsByProvider.set(o.providerId, list);
  }

  const providers: DiscoverProvider[] = rows.map((p) => ({
    id: p.id,
    businessName: p.businessName,
    bio: p.bio,
    serviceMode: p.serviceMode,
    ratingAvg: p.ratingAvg ? Number(p.ratingAvg) : null,
    ratingCount: p.ratingCount,
    shopCity: p.shopCity,
    categories: categoriesByProvider.get(p.id) ?? [],
    categoryLabels: (categoriesByProvider.get(p.id) ?? []).map((c) => categoryLabels[c] ?? c),
    specialties: specialtiesByProvider.get(p.id) ?? [],
    offeringLabels: offeringLabelsByProvider.get(p.id) ?? [],
    lat: p.lat ? Number(p.lat) : null,
    lng: p.lng ? Number(p.lng) : null,
  }));

  return (
    <div className="home-page">
      <PublicHeader />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6" style={{ paddingTop: 140, paddingBottom: 80 }}>
        <div>
          <h1 className="home-serif" style={{ fontSize: 32 }}>
            Find a pro
          </h1>
          <p className="home-lede" style={{ marginTop: 10 }}>
            Every pro listed here has passed identity, license, insurance, and background
            verification.
          </p>
        </div>

        {providers.length === 0 ? (
          <EmptyState>No verified pros are listable yet in this market.</EmptyState>
        ) : (
          <DiscoverResults
            providers={providers}
            categoryOptions={categoryOptions}
            specialtyOptions={specialtyOptions}
            initialCategory={initialCategory}
            initialNear={initialNear}
          />
        )}
      </main>
    </div>
  );
}
