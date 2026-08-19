import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { providerCategoryTypes, providerSpecialtyTypes } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { dashboardPathForRole } from "@/lib/auth/role-redirect";
import { PublicHeader } from "@/components/home/public-header";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { applyAsProvider } from "./actions";

export default async function BecomeAProviderPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/become-a-provider");

  const role = (session.user as { role?: string }).role ?? "owner";
  if (role !== "owner") {
    redirect(role === "provider" ? "/provider/onboarding" : dashboardPathForRole(role));
  }

  const [categoryOptions, specialtyOptions] = await Promise.all([
    db
      .select()
      .from(providerCategoryTypes)
      .where(eq(providerCategoryTypes.active, true))
      .orderBy(asc(providerCategoryTypes.sortOrder)),
    db
      .select()
      .from(providerSpecialtyTypes)
      .where(eq(providerSpecialtyTypes.active, true))
      .orderBy(asc(providerSpecialtyTypes.sortOrder)),
  ]);

  return (
    <div className="home-page">
      <PublicHeader />
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6" style={{ paddingTop: 140, paddingBottom: 80 }}>
        <div>
          <h1 className="home-serif" style={{ fontSize: 32 }}>
            Become a provider
          </h1>
          <p className="home-lede" style={{ marginTop: 10 }}>
            Tell us about your business. You&apos;ll submit verification documents next — nothing
            goes live until an admin reviews and approves them.
          </p>
        </div>

        <Card>
          <form action={applyAsProvider} className="flex flex-col gap-6">
            <Input label="Business name" type="text" name="businessName" />
            <Textarea
              label="Bio"
              name="bio"
              placeholder="A few years turning wrenches, the last two running my own mobile business..."
            />

            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend className="home-field-label" style={{ marginBottom: 8 }}>
                Categories
              </legend>
              <div className="flex flex-col gap-2">
                {categoryOptions.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="category" value={c.id} />
                    {c.label}
                    {c.comingSoon ? (
                      <span style={{ color: "var(--home-text-muted)" }}>
                        (Coming soon — we&apos;ll reach out once this category opens to owners)
                      </span>
                    ) : null}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
              <legend className="home-field-label" style={{ marginBottom: 8 }}>
                Specialties (optional)
              </legend>
              <div className="flex flex-col gap-2">
                {specialtyOptions.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="specialty" value={s.id} />
                    {s.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <Select label="How do you work?" name="serviceMode" defaultValue="mobile">
              <option value="mobile">Mobile only</option>
              <option value="shop">Shop only</option>
              <option value="both">Both</option>
            </Select>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Shop city" type="text" name="shopCity" />
              <Input label="Shop state" type="text" name="shopState" />
            </div>

            <div className="sm:max-w-xs">
              <Input label="Service radius (miles)" type="number" name="serviceRadiusMiles" min={0} />
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="backgroundCheckConsent" className="mt-1" />
              <span>
                I consent to a background check as part of Tovant&apos;s provider verification
                process.
              </span>
            </label>

            <Button type="submit" style={{ alignSelf: "flex-start" }}>
              Submit application
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
