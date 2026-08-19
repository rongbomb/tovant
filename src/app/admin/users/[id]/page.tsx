import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, providerProfiles, user } from "@/db/schema";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { banUserAction, unbanUserAction } from "../actions";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  provider: "Provider",
  admin: "Admin",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="home-field-label">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const targetUser = await db.query.user.findFirst({ where: eq(user.id, id) });
  if (!targetUser) notFound();

  const [profile, providerProfile] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.userId, id) }),
    targetUser.role === "provider"
      ? db.query.providerProfiles.findFirst({ where: eq(providerProfiles.userId, id) })
      : Promise.resolve(undefined),
  ]);

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="home-serif" style={{ fontSize: 28 }}>
            {targetUser.name}
          </h1>
          <p className="text-sm" style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}>
            {targetUser.email}
          </p>
        </div>
        {targetUser.banned ? (
          <form action={unbanUserAction}>
            <input type="hidden" name="userId" value={targetUser.id} />
            <Button type="submit" variant="ghost" style={{ padding: "10px 18px", fontSize: 13 }}>
              Unban
            </Button>
          </form>
        ) : (
          <form action={banUserAction} className="flex items-center gap-2">
            <input type="hidden" name="userId" value={targetUser.id} />
            <Input type="text" name="reason" placeholder="Reason (optional)" style={{ fontSize: 13 }} />
            <Button type="submit" variant="ghost" style={{ padding: "10px 18px", fontSize: 13 }}>
              Ban
            </Button>
          </form>
        )}
      </div>

      <Card>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Role">{ROLE_LABEL[targetUser.role] ?? targetUser.role}</Field>
          <Field label="Status">
            <Badge tone={targetUser.banned ? "danger" : "success"}>
              {targetUser.banned ? "Banned" : "Active"}
            </Badge>
          </Field>
          {targetUser.banned && targetUser.banReason ? (
            <div className="sm:col-span-2">
              <dt className="home-field-label">Ban reason</dt>
              <dd className="text-sm">{targetUser.banReason}</dd>
            </div>
          ) : null}
          <Field label="Phone">{targetUser.phone ?? "Not provided"}</Field>
          <Field label="Joined">{targetUser.createdAt.toLocaleDateString()}</Field>
          {profile?.city || profile?.state ? (
            <Field label="Location">{[profile.city, profile.state].filter(Boolean).join(", ")}</Field>
          ) : null}
        </dl>
      </Card>

      {providerProfile ? (
        <Button href={`/admin/providers/${providerProfile.id}`} style={{ alignSelf: "flex-start" }}>
          View provider verification
        </Button>
      ) : null}
    </div>
  );
}
