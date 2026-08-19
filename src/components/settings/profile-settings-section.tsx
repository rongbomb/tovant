import Image from "next/image";
import { updateProfile, uploadAvatar } from "@/lib/profile/actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function ProfileSettingsSection({
  userId,
  hasAvatar,
  displayName,
  addressLine1,
  city,
  state,
  postalCode,
  phone,
}: {
  userId: string;
  hasAvatar: boolean;
  displayName: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  phone: string | null;
}) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="home-serif" style={{ fontSize: 20 }}>
          Profile
        </h2>
        <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
          Your name and photo — shown on messages and reviews.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full"
          style={{ border: "1px solid var(--home-line)", background: "var(--home-tint)" }}
        >
          {hasAvatar ? (
            <Image
              src={`/api/avatars/${userId}/image`}
              alt="Profile photo"
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          ) : null}
        </div>
        <form action={uploadAvatar} className="flex items-center gap-2">
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="text-sm"
            style={{ color: "var(--home-text)" }}
          />
          <Button type="submit" variant="ghost" style={{ padding: "9px 16px", fontSize: 13 }}>
            Upload
          </Button>
        </form>
      </div>

      <Card>
        <form action={updateProfile} className="grid gap-3 sm:grid-cols-2">
          <Input label="Display name" type="text" name="displayName" defaultValue={displayName ?? ""} />
          <Input label="Phone" type="tel" name="phone" defaultValue={phone ?? ""} />
          <div className="sm:col-span-2">
            <Input label="Address" type="text" name="addressLine1" defaultValue={addressLine1 ?? ""} />
          </div>
          <Input label="City" type="text" name="city" defaultValue={city ?? ""} />
          <Input label="State" type="text" name="state" defaultValue={state ?? ""} />
          <Input label="Postal code" type="text" name="postalCode" defaultValue={postalCode ?? ""} />
          <Button type="submit" style={{ alignSelf: "flex-start", gridColumn: "1 / -1" }}>
            Save profile
          </Button>
        </form>
      </Card>
    </section>
  );
}
