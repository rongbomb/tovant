import { eq } from "drizzle-orm";
import Image from "next/image";
import { db } from "@/db";
import {
  profiles,
  providerProfiles,
  providerCategories,
  providerServiceOfferings,
  providerGalleryPhotos,
} from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { getActiveServiceOfferingsForCategories } from "@/lib/service-offerings";
import { getCategoryLabelMap } from "@/lib/taxonomy-labels";
import { ProfileSettingsSection } from "@/components/settings/profile-settings-section";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { updateServiceOfferings, uploadGalleryPhoto } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_TONE: Record<string, "neutral" | "success" | "danger"> = {
  pending: "neutral",
  approved: "success",
  rejected: "danger",
};

export default async function ProviderSettingsPage() {
  const session = await getSession();
  const provider = session
    ? await db.query.providerProfiles.findFirst({
        where: eq(providerProfiles.userId, session.user.id),
      })
    : null;

  const [offerings, galleryPhotos, profile, categories] = provider
    ? await Promise.all([
        db
          .select()
          .from(providerServiceOfferings)
          .where(eq(providerServiceOfferings.providerId, provider.id)),
        db
          .select()
          .from(providerGalleryPhotos)
          .where(eq(providerGalleryPhotos.providerId, provider.id))
          .orderBy(providerGalleryPhotos.createdAt),
        session
          ? db.query.profiles.findFirst({ where: eq(profiles.userId, session.user.id) })
          : undefined,
        db
          .select()
          .from(providerCategories)
          .where(eq(providerCategories.providerId, provider.id)),
      ])
    : [[], [], undefined, []];

  const categoryIds = categories.map((c) => c.category);
  const [activeOfferings, categoryLabels] = await Promise.all([
    getActiveServiceOfferingsForCategories(categoryIds),
    getCategoryLabelMap(),
  ]);

  const selectedOfferings = new Set(offerings.map((o) => o.offering));

  return (
    <div className="flex flex-col gap-10 p-8">
      <h1 className="home-serif" style={{ fontSize: 28 }}>
        Settings
      </h1>

      {session ? (
        <ProfileSettingsSection
          userId={session.user.id}
          hasAvatar={Boolean(profile?.avatarObjectKey)}
          displayName={profile?.displayName ?? null}
          addressLine1={profile?.addressLine1 ?? null}
          city={profile?.city ?? null}
          state={profile?.state ?? null}
          postalCode={profile?.postalCode ?? null}
          phone={(session.user as { phone?: string | null }).phone ?? null}
        />
      ) : null}

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="home-serif" style={{ fontSize: 20 }}>
            Services
          </h2>
          <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
            Select what you offer — this shows on your public profile&apos;s Services tab.
          </p>
        </div>
        <Card>
          <form action={updateServiceOfferings} className="flex flex-col gap-4">
            {categoryIds.length === 0 ? (
              <EmptyState>Add a category at /become-a-provider before selecting services.</EmptyState>
            ) : (
              categoryIds.map((categoryId) => {
                const offeringsForCategory = activeOfferings.filter((o) => o.categoryId === categoryId);
                if (offeringsForCategory.length === 0) return null;
                return (
                  <div key={categoryId} className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--home-text-muted)" }}>
                      {categoryLabels[categoryId] ?? categoryId}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {offeringsForCategory.map((o) => (
                        <label
                          key={o.value}
                          className="flex items-center gap-2 text-sm"
                          style={{ border: "1px solid var(--home-line)", borderRadius: 10, padding: "8px 12px" }}
                        >
                          <input type="checkbox" name="offering" value={o.value} defaultChecked={selectedOfferings.has(o.value)} />
                          {o.label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
            <div className="sm:max-w-xs">
              <Input
                label="Typical hourly rate (optional)"
                type="number"
                name="hourlyRate"
                min={0}
                step="0.01"
                defaultValue={provider?.hourlyRateCents ? (provider.hourlyRateCents / 100).toFixed(2) : ""}
                placeholder="85.00"
              />
            </div>
            <Button type="submit" style={{ alignSelf: "flex-start" }}>
              Save services
            </Button>
          </form>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="home-serif" style={{ fontSize: 20 }}>
            Recent work
          </h2>
          <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
            Upload photos of completed jobs. An admin reviews each photo before it appears on
            your public profile. Photos aren&apos;t visible to anyone else until approved.
          </p>
        </div>

        {galleryPhotos.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {galleryPhotos.map((photo) => (
              <li key={photo.id} className="flex flex-col gap-1">
                <div
                  className="relative aspect-square overflow-hidden"
                  style={{ borderRadius: 12, border: "1px solid var(--home-line)", background: "var(--home-tint)" }}
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
                <Badge tone={STATUS_TONE[photo.status]}>{STATUS_LABEL[photo.status]}</Badge>
                {photo.status === "rejected" && photo.rejectionReason ? (
                  <span className="text-xs" style={{ color: "var(--home-text-muted)" }}>
                    {photo.rejectionReason}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No photos uploaded yet.</EmptyState>
        )}

        <Card className="flex flex-col gap-3 sm:max-w-sm">
          <form action={uploadGalleryPhoto} className="flex flex-col gap-3">
            <label>
              <span className="home-field-label">Photo</span>
              <input
                type="file"
                name="file"
                accept="image/jpeg,image/png,image/webp"
                required
                className="text-sm"
                style={{ color: "var(--home-text)" }}
              />
            </label>
            <Input label="Caption (optional)" type="text" name="caption" />
            <Button type="submit" style={{ alignSelf: "flex-start" }}>
              Upload
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
