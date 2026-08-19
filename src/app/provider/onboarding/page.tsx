import { eq } from "drizzle-orm";
import { db } from "@/db";
import { providerProfiles, providerSpecialties, providerSpecialtyTypes, verificationRecords } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { uploadVerificationDocument } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  pending: "Pending review",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
};

const STATUS_TONE: Record<string, "neutral" | "success" | "danger"> = {
  not_started: "neutral",
  pending: "neutral",
  in_review: "neutral",
  approved: "success",
  rejected: "danger",
  expired: "danger",
};

const DOC_TYPE_LABEL: Record<string, string> = {
  identity: "Identity",
  license: "License",
  insurance: "Insurance",
};

export default async function ProviderOnboardingPage() {
  const session = await getSession();
  if (!session) return null;

  const provider = await db.query.providerProfiles.findFirst({
    where: eq(providerProfiles.userId, session.user.id),
  });

  if (!provider) {
    return (
      <div className="p-8">
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Verification &amp; onboarding
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--home-text-muted)" }}>
          You don&apos;t have a provider application on file yet.
        </p>
      </div>
    );
  }

  const [records, specialties] = await Promise.all([
    db.select().from(verificationRecords).where(eq(verificationRecords.providerId, provider.id)),
    db
      .select({ specialty: providerSpecialties.specialty, label: providerSpecialtyTypes.label })
      .from(providerSpecialties)
      .innerJoin(providerSpecialtyTypes, eq(providerSpecialtyTypes.id, providerSpecialties.specialty))
      .where(eq(providerSpecialties.providerId, provider.id)),
  ]);

  const recordFor = (type: string, specialty?: string) =>
    records.find((r) => r.type === type && (specialty ? r.specialty === specialty : true));

  const backgroundCheck = recordFor("background_check");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div>
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Verification &amp; onboarding
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--home-text-muted)" }}>
          {provider.isListable
            ? "You're fully verified and listed on Tovant."
            : "Submit each document below. An admin reviews everything before your profile goes live."}
        </p>
        <div className="mt-2">
          <Badge tone={STATUS_TONE[provider.overallVerificationStatus]}>
            Overall status: {STATUS_LABEL[provider.overallVerificationStatus]}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {(["identity", "license", "insurance"] as const).map((type) => {
          const record = recordFor(type);
          return (
            <Card key={type}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{DOC_TYPE_LABEL[type]}</p>
                <Badge tone={STATUS_TONE[record?.status ?? "not_started"]}>
                  {STATUS_LABEL[record?.status ?? "not_started"]}
                </Badge>
              </div>
              {record?.status === "rejected" && record.rejectionReason ? (
                <p className="mt-1 text-sm" style={{ color: "var(--home-text-muted)" }}>
                  {record.rejectionReason}
                </p>
              ) : null}
              {record?.status !== "approved" ? (
                <form action={uploadVerificationDocument} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="type" value={type} />
                  <input
                    type="file"
                    name="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    required
                    className="text-sm"
                    style={{ color: "var(--home-text)" }}
                  />
                  <Button type="submit" style={{ padding: "9px 16px", fontSize: 13 }}>
                    {record ? "Resubmit" : "Upload"}
                  </Button>
                </form>
              ) : null}
            </Card>
          );
        })}

        {specialties.map((s) => {
          const record = recordFor("specialty_credential", s.specialty);
          return (
            <Card key={s.specialty}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{s.label}</p>
                <Badge tone={STATUS_TONE[record?.status ?? "not_started"]}>
                  {STATUS_LABEL[record?.status ?? "not_started"]}
                </Badge>
              </div>
              {record?.status === "rejected" && record.rejectionReason ? (
                <p className="mt-1 text-sm" style={{ color: "var(--home-text-muted)" }}>
                  {record.rejectionReason}
                </p>
              ) : null}
              {record?.status !== "approved" ? (
                <form action={uploadVerificationDocument} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="type" value="specialty_credential" />
                  <input type="hidden" name="specialty" value={s.specialty} />
                  <input
                    type="file"
                    name="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    required
                    className="text-sm"
                    style={{ color: "var(--home-text)" }}
                  />
                  <Button type="submit" style={{ padding: "9px 16px", fontSize: 13 }}>
                    {record ? "Resubmit" : "Upload"}
                  </Button>
                </form>
              ) : null}
            </Card>
          );
        })}

        <Card>
          <div className="flex items-center justify-between">
            <p className="font-semibold">Background check</p>
            <Badge tone={STATUS_TONE[backgroundCheck?.status ?? "not_started"]}>
              {STATUS_LABEL[backgroundCheck?.status ?? "not_started"]}
            </Badge>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--home-text-muted)" }}>
            {backgroundCheck
              ? "Handled automatically through our background check partner — no action needed."
              : "You didn't consent to a background check when you applied. Contact support to add one."}
          </p>
        </Card>
      </div>
    </div>
  );
}
