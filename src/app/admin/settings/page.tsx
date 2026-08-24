import Image from "next/image";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import {
  providerCategoryTypes,
  providerSpecialtyTypes,
  serviceOfferingTypes,
  siteSettings,
} from "@/db/schema";
import { HOMEPAGE_IMAGE_SLOTS, getHomepageImages } from "@/lib/homepage-images";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { updateHomepageImage } from "./actions";
import {
  addTaxonomyEntry,
  toggleTaxonomyActive,
  toggleCategoryComingSoon,
  updateSiteSetting,
} from "./taxonomy-actions";

const TAXONOMY_SECTIONS = [
  { kind: "category" as const, title: "Categories", table: providerCategoryTypes },
  { kind: "specialty" as const, title: "Specialties", table: providerSpecialtyTypes },
  { kind: "offering" as const, title: "Service offerings", table: serviceOfferingTypes },
];

const SETTING_LABEL: Record<string, string> = {
  escrow_auto_release_hours: "Escrow auto-release window (hours)",
  default_cancellation_window_hours: "Default free-cancellation window (hours)",
  per_lead_fee_cents: "Per-lead fee charged to provider (cents)",
  late_cancellation_fee_percent: "Late-cancellation fee (% of quoted price)",
};

const SETTING_KEYS = [
  "escrow_auto_release_hours",
  "default_cancellation_window_hours",
  "per_lead_fee_cents",
  "late_cancellation_fee_percent",
] as const;

export default async function AdminSettingsPage() {
  const [images, taxonomyRows, settingsRows] = await Promise.all([
    getHomepageImages(),
    Promise.all(
      TAXONOMY_SECTIONS.map((s) => db.select().from(s.table).orderBy(asc(s.table.sortOrder))),
    ),
    db.select().from(siteSettings),
  ]);

  const settingsByKey = new Map(settingsRows.map((s) => [s.id, s.valueInt]));
  const categoryRows = taxonomyRows[0];
  const categoryLabelById = new Map(categoryRows.map((c) => [c.id, c.label]));

  return (
    <div className="flex flex-col gap-8 p-8">
      <h1 className="home-serif" style={{ fontSize: 28 }}>
        Settings
      </h1>

      <section className="flex flex-col gap-6">
        <div>
          <h2 className="home-serif" style={{ fontSize: 20 }}>
            Taxonomy
          </h2>
          <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
            Manage the categories, specialties, and service offerings providers can select.
            Deactivating an entry hides it from new selections — it never deletes existing data.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {TAXONOMY_SECTIONS.map((section, i) => (
            <Card key={section.kind} className="flex flex-col gap-3">
              <p className="font-semibold text-sm">{section.title}</p>
              <ul className="flex flex-col gap-2">
                {taxonomyRows[i].map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-2 text-sm">
                    <span
                      style={{
                        color: row.active ? "var(--home-text)" : "var(--home-text-muted)",
                        textDecoration: row.active ? "none" : "line-through",
                      }}
                    >
                      {row.label}
                      {section.kind === "category" && "comingSoon" in row && row.comingSoon ? (
                        <span className="home-badge home-badge-neutral" style={{ marginLeft: 8 }}>
                          Coming soon
                        </span>
                      ) : null}
                      {section.kind === "offering" && "categoryId" in row ? (
                        <span className="home-badge home-badge-neutral" style={{ marginLeft: 8 }}>
                          {categoryLabelById.get(row.categoryId) ?? row.categoryId}
                        </span>
                      ) : null}
                    </span>
                    <div className="flex gap-2">
                      {section.kind === "category" && "comingSoon" in row ? (
                        <form action={toggleCategoryComingSoon}>
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="comingSoon" value={String(row.comingSoon)} />
                          <Button type="submit" variant="ghost" style={{ padding: "5px 12px", fontSize: 11 }}>
                            {row.comingSoon ? "Mark live" : "Mark coming soon"}
                          </Button>
                        </form>
                      ) : null}
                      <form action={toggleTaxonomyActive}>
                        <input type="hidden" name="kind" value={section.kind} />
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="active" value={String(row.active)} />
                        <Button type="submit" variant="ghost" style={{ padding: "5px 12px", fontSize: 11 }}>
                          {row.active ? "Deactivate" : "Activate"}
                        </Button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
              <form action={addTaxonomyEntry} className="flex flex-col gap-2">
                <input type="hidden" name="kind" value={section.kind} />
                <div className="flex gap-2">
                  <Input type="text" name="label" placeholder="New entry" required style={{ fontSize: 13 }} />
                  <Button type="submit" style={{ padding: "9px 16px", fontSize: 11 }}>
                    Add
                  </Button>
                </div>
                {section.kind === "offering" ? (
                  <Select name="categoryId" required defaultValue="" style={{ fontSize: 13 }}>
                    <option value="" disabled>
                      Category this offering belongs to
                    </option>
                    {categoryRows.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </Select>
                ) : null}
              </form>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div>
          <h2 className="home-serif" style={{ fontSize: 20 }}>
            Business rules
          </h2>
          <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
            Platform-wide timing rules used by the escrow and cancellation flows.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {SETTING_KEYS.map((key) => (
            <Card key={key}>
              <form action={updateSiteSetting} className="flex flex-col gap-2">
                <input type="hidden" name="key" value={key} />
                <Input
                  label={SETTING_LABEL[key]}
                  type="number"
                  name="value"
                  min={1}
                  defaultValue={settingsByKey.get(key) ?? ""}
                  required
                />
                <Button type="submit" style={{ alignSelf: "flex-start", padding: "9px 18px", fontSize: 13 }}>
                  Save
                </Button>
              </form>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div>
          <h2 className="home-serif" style={{ fontSize: 20 }}>
            Homepage images
          </h2>
          <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
            Replace the photos shown on the public homepage. JPEG, PNG, or WebP, up to 5MB.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {HOMEPAGE_IMAGE_SLOTS.map(({ slot, label }) => {
            const image = images[slot];
            return (
              <Card key={slot} className="flex flex-col gap-3">
                <form action={updateHomepageImage} className="flex flex-col gap-3">
                  <div
                    className="relative h-40 w-full overflow-hidden"
                    style={{ borderRadius: 12, border: "1px solid var(--home-line)" }}
                  >
                    <Image
                      src={image.path}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>

                  <p className="font-semibold text-sm">{label}</p>

                  <input type="hidden" name="slot" value={slot} />

                  <label>
                    <span className="home-field-label">Replacement image</span>
                    <input
                      type="file"
                      name="file"
                      accept="image/jpeg,image/png,image/webp"
                      required
                      className="text-sm"
                      style={{ color: "var(--home-text)" }}
                    />
                  </label>

                  <Input label="Alt text" type="text" name="altText" defaultValue={image.alt} required />

                  <Button type="submit" style={{ alignSelf: "flex-start", padding: "9px 18px", fontSize: 13 }}>
                    Save
                  </Button>
                </form>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
