import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, vehicles } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { ProfileSettingsSection } from "@/components/settings/profile-settings-section";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { addVehicle, deleteVehicle } from "./actions";

export default async function OwnerSettingsPage() {
  const session = await getSession();
  const [ownerVehicles, profile] = session
    ? await Promise.all([
        db.select().from(vehicles).where(eq(vehicles.ownerId, session.user.id)),
        db.query.profiles.findFirst({ where: eq(profiles.userId, session.user.id) }),
      ])
    : [[], undefined];

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

      {session && (session.user as { role?: string }).role === "owner" ? (
        <Card className="flex items-center justify-between gap-4">
          <div>
            <h2 className="home-serif" style={{ fontSize: 16 }}>
              Become a provider
            </h2>
            <p className="text-sm" style={{ color: "var(--home-text-muted)" }}>
              Offer repairs, detailing, or upgrade work on Tovant.
            </p>
          </div>
          <Button href="/become-a-provider">Apply</Button>
        </Card>
      ) : null}

      <section id="my-garage" className="flex flex-col gap-6">
        <div>
          <h2 className="home-serif" style={{ fontSize: 20 }}>
            My Garage
          </h2>
          <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
            Vehicles saved here can be reused when requesting a quote from a provider.
          </p>
        </div>

        {ownerVehicles.length === 0 ? (
          <EmptyState>No vehicles saved yet.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {ownerVehicles.map((v) => (
              <Card key={v.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {v.nickname ? `${v.nickname} — ` : ""}
                    {v.year} {v.make} {v.model}
                  </p>
                  <p
                    className="text-xs"
                    style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
                  >
                    {[v.vin ? `VIN ${v.vin}` : null, v.mileage ? `${v.mileage.toLocaleString()} mi` : null]
                      .filter(Boolean)
                      .join(" · ") || "No additional details"}
                  </p>
                </div>
                <form action={deleteVehicle}>
                  <input type="hidden" name="vehicleId" value={v.id} />
                  <Button type="submit" variant="ghost" style={{ padding: "9px 16px", fontSize: 13 }}>
                    Remove
                  </Button>
                </form>
              </Card>
            ))}
          </ul>
        )}

        <Card>
          <form action={addVehicle} className="grid gap-3 sm:grid-cols-2">
            <Input label="Year" type="number" name="year" required min={1900} max={new Date().getFullYear() + 1} />
            <Input label="Make" type="text" name="make" required />
            <Input label="Model" type="text" name="model" required />
            <Input label="Nickname (optional)" type="text" name="nickname" />
            <Input label="VIN (optional)" type="text" name="vin" />
            <Input label="Mileage (optional)" type="number" name="mileage" min={0} />
            <Button type="submit" style={{ alignSelf: "flex-start", gridColumn: "1 / -1" }}>
              Add vehicle
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
