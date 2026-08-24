import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/db";
import {
  providerProfiles,
  providerCategories,
  providerSpecialties,
  verificationRecords,
  providerServiceOfferings,
  providerGalleryPhotos,
  reviews,
  profiles,
  vehicles,
} from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { getProviderStats } from "@/lib/provider-stats";
import { getServiceOfferingLabelMap } from "@/lib/service-offerings";
import { getCategoryLabelMap, getSpecialtyLabelMap } from "@/lib/taxonomy-labels";
import { RatingBars } from "@/components/ui/rating-bars";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PublicHeader } from "@/components/home/public-header";
import { ProfileTabs } from "@/components/provider-profile/profile-tabs";
import { QuoteRequestCard } from "@/components/provider-profile/quote-request-card";

const VERIFICATION_LABEL: Record<string, string> = {
  identity: "ID verified",
  license: "Licensed",
  insurance: "Insured",
  background_check: "Background checked",
  specialty_credential: "Specialty certified",
};

const STATUS_TONE: Record<string, "success" | "neutral" | "danger"> = {
  approved: "success",
  pending: "neutral",
  in_review: "neutral",
  not_started: "neutral",
  rejected: "danger",
  expired: "danger",
};

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const provider = await db.query.providerProfiles.findFirst({
    where: eq(providerProfiles.id, id),
  });
  if (!provider || !provider.isListable) {
    notFound();
  }

  // Fire-and-forget — a simple running total, not deduped per visitor.
  db.update(providerProfiles)
    .set({ profileViewCount: provider.profileViewCount + 1 })
    .where(eq(providerProfiles.id, provider.id))
    .catch(() => {});

  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isOwner = !!session && role === "owner";

  const [
    categories,
    specialties,
    verifications,
    offerings,
    galleryPhotos,
    reviewRows,
    stats,
    ownerVehicles,
    offeringLabels,
    categoryLabels,
    specialtyLabels,
  ] = await Promise.all([
      db.select().from(providerCategories).where(eq(providerCategories.providerId, provider.id)),
      db.select().from(providerSpecialties).where(eq(providerSpecialties.providerId, provider.id)),
      db.select().from(verificationRecords).where(eq(verificationRecords.providerId, provider.id)),
      db
        .select()
        .from(providerServiceOfferings)
        .where(eq(providerServiceOfferings.providerId, provider.id)),
      db
        .select()
        .from(providerGalleryPhotos)
        .where(
          and(
            eq(providerGalleryPhotos.providerId, provider.id),
            eq(providerGalleryPhotos.status, "approved"),
          ),
        ),
      db
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
        .orderBy(desc(reviews.createdAt))
        .limit(20),
      getProviderStats(provider.id, provider.userId),
      isOwner
        ? db.select().from(vehicles).where(eq(vehicles.ownerId, session.user.id))
        : Promise.resolve([]),
      getServiceOfferingLabelMap(),
      getCategoryLabelMap(),
      getSpecialtyLabelMap(),
    ]);

  const categoryNames = categories.map((c) => categoryLabels[c.category] ?? c.category);
  const categoryOptions = categories.map((c) => ({
    id: c.category,
    label: categoryLabels[c.category] ?? c.category,
  }));
  const badges = [
    ...verifications
      .filter((v) => v.status === "approved" && v.type !== "specialty_credential")
      .map((v) => VERIFICATION_LABEL[v.type]),
    ...specialties
      .filter((s) =>
        verifications.some(
          (v) => v.id === s.verificationRecordId && v.status === "approved",
        ),
      )
      .map((s) => specialtyLabels[s.specialty] ?? s.specialty),
  ];

  return (
    <div className="home-page">
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-6" style={{ paddingTop: 140, paddingBottom: 80 }}>
        <p className="mb-6 text-sm" style={{ color: "var(--home-text-muted)" }}>
          <a href="/discover" style={{ color: "inherit" }}>Find a pro</a>
          {categoryNames[0] ? <> &nbsp;/&nbsp; <span>{categoryNames[0]}</span></> : null}
          &nbsp;/&nbsp; {provider.businessName ?? "Unnamed provider"}
        </p>

        <section
          className="flex flex-wrap items-start gap-6 pb-10"
          style={{ borderBottom: "1px solid var(--home-line)" }}
        >
          <div
            className="h-24 w-24 flex-shrink-0"
            style={{ borderRadius: 20, border: "1px solid var(--home-line)", background: "var(--home-tint)" }}
          />
          <div className="min-w-60 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="home-serif" style={{ fontSize: 32 }}>
                {provider.businessName ?? "Unnamed provider"}
              </h1>
              {provider.overallVerificationStatus === "approved" ? (
                <Badge tone="success">Verified</Badge>
              ) : null}
            </div>
            <p className="mt-1.5 text-[15px]" style={{ color: "var(--home-text-muted)" }}>
              {categoryNames.join(", ")}
              {provider.serviceMode !== "shop" ? " · Mobile" : ""}
              {provider.serviceMode !== "mobile" ? " · Shop" : ""}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-4 text-[13px]" style={{ color: "var(--home-text-muted)" }}>
              {provider.serviceRadiusMiles ? (
                <span>Serves {provider.serviceRadiusMiles} mi around {provider.shopCity ?? "the area"}</span>
              ) : null}
              <span>{stats.completedJobsCount} jobs completed</span>
              {stats.avgResponseMinutes !== null ? (
                <span>Responds in ~{stats.avgResponseMinutes} min</span>
              ) : null}
            </div>
            {badges.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span key={b} className="home-badge home-badge-neutral">
                    {b}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <div className="grid gap-12 py-11 lg:grid-cols-[1fr_380px]">
          <ProfileTabs
            panels={{
              Overview: (
                <div key="Overview" className="flex flex-col gap-9">
                  <div>
                    <h3 className="home-serif" style={{ fontSize: 18, marginBottom: 16 }}>
                      About
                    </h3>
                    <p className="text-[14.5px] leading-7" style={{ color: "var(--home-text-muted)" }}>
                      {provider.bio || "This pro hasn't added a bio yet."}
                    </p>
                  </div>

                  <div>
                    <h3 className="home-serif" style={{ fontSize: 18, marginBottom: 16 }}>
                      Recent work
                    </h3>
                    {galleryPhotos.length === 0 ? (
                      <EmptyState>No photos yet.</EmptyState>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {galleryPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative aspect-square overflow-hidden"
                            style={{ borderRadius: 16, border: "1px solid var(--home-line)", background: "var(--home-tint)" }}
                          >
                            <Image
                              src={`/api/gallery-photos/${photo.id}/image`}
                              alt={photo.caption ?? "Recent work photo"}
                              fill
                              sizes="200px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ),
              Services: (
                <div key="Services">
                  <h3 className="home-serif" style={{ fontSize: 18, marginBottom: 16 }}>
                    Services offered
                  </h3>
                  {offerings.length === 0 ? (
                    <EmptyState>This pro hasn&apos;t listed specific services yet.</EmptyState>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {offerings.map((o) => (
                        <li key={o.id} className="home-badge home-badge-neutral" style={{ fontSize: 13.5 }}>
                          {offeringLabels[o.offering] ?? o.offering}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ),
              Reviews: (
                <div key="Reviews">
                  <h3 className="home-serif" style={{ fontSize: 18, marginBottom: 16 }}>
                    Reviews ({reviewRows.length})
                  </h3>
                  {reviewRows.length === 0 ? (
                    <EmptyState>No reviews yet.</EmptyState>
                  ) : (
                    <div className="flex flex-col">
                      {reviewRows.map((r) => (
                        <div
                          key={r.id}
                          className="flex gap-4 py-5"
                          style={{ borderBottom: "1px solid var(--home-line)" }}
                        >
                          <div
                            className="h-10 w-10 flex-shrink-0"
                            style={{ borderRadius: 10, background: "var(--home-tint)" }}
                          />
                          <div>
                            <div className="text-sm font-bold">{r.reviewerName ?? "Tovant owner"}</div>
                            <div
                              className="text-[11px]"
                              style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
                            >
                              {new Date(r.createdAt).toLocaleDateString()}
                            </div>
                            <div className="mt-1.5">
                              <RatingBars value={r.rating} />
                            </div>
                            <p className="mt-2 text-sm leading-6">{r.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
              Certifications: (
                <div key="Certifications">
                  <h3 className="home-serif" style={{ fontSize: 18, marginBottom: 16 }}>
                    Certifications on file
                  </h3>
                  {verifications.length === 0 ? (
                    <EmptyState>No verification records yet.</EmptyState>
                  ) : (
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      {verifications.map((v) => (
                        <div key={v.id} className="home-card flex items-start gap-3">
                          <div className="flex-1">
                            <div className="text-[13.5px] font-bold">
                              {v.specialty ? specialtyLabels[v.specialty] ?? v.specialty : VERIFICATION_LABEL[v.type]}
                            </div>
                            <div
                              className="mt-1 text-[11px]"
                              style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
                            >
                              {v.status.replace("_", " ")}
                              {v.expiresAt ? ` · expires ${new Date(v.expiresAt).toLocaleDateString()}` : ""}
                            </div>
                          </div>
                          <Badge tone={STATUS_TONE[v.status]}>{v.status.replace("_", " ")}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
            }}
          />

          <QuoteRequestCard
            providerId={provider.id}
            category={categoryOptions[0]?.id ?? null}
            categories={categoryOptions}
            isLoggedIn={isOwner}
            ratingAvg={provider.ratingAvg ? Number(provider.ratingAvg) : null}
            hourlyRateCents={provider.hourlyRateCents}
            acceptingLeads={provider.acceptingLeads}
            vehicles={ownerVehicles.map((v) => ({
              id: v.id,
              label: `${v.year} ${v.make} ${v.model}${v.mileage ? ` · ${v.mileage.toLocaleString()} mi` : ""}`,
            }))}
          />
        </div>
      </main>
    </div>
  );
}
