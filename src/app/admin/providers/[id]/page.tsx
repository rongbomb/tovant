import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  providerCategories,
  providerCategoryTypes,
  providerProfiles,
  providerSpecialties,
  providerSpecialtyTypes,
  verificationRecords,
} from "@/db/schema";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { approveVerificationRecord, rejectVerificationRecord } from "../actions";

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
  background_check: "Background check",
  specialty_credential: "Specialty credential",
};

export default async function AdminProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const provider = await db.query.providerProfiles.findFirst({
    where: eq(providerProfiles.id, id),
  });
  if (!provider) notFound();

  const [categories, specialties, records, specialtyTypeRows] = await Promise.all([
    db
      .select({ id: providerCategories.id, category: providerCategories.category, label: providerCategoryTypes.label })
      .from(providerCategories)
      .innerJoin(providerCategoryTypes, eq(providerCategoryTypes.id, providerCategories.category))
      .where(eq(providerCategories.providerId, id)),
    db
      .select({ id: providerSpecialties.id, specialty: providerSpecialties.specialty, label: providerSpecialtyTypes.label })
      .from(providerSpecialties)
      .innerJoin(providerSpecialtyTypes, eq(providerSpecialtyTypes.id, providerSpecialties.specialty))
      .where(eq(providerSpecialties.providerId, id)),
    db
      .select()
      .from(verificationRecords)
      .where(eq(verificationRecords.providerId, id))
      .orderBy(verificationRecords.createdAt),
    db.select().from(providerSpecialtyTypes),
  ]);

  const specialtyLabelMap = Object.fromEntries(specialtyTypeRows.map((s) => [s.id, s.label]));

  const recordLabel = (r: (typeof records)[number]) =>
    r.type === "specialty_credential" && r.specialty
      ? (specialtyLabelMap[r.specialty] ?? r.specialty)
      : DOC_TYPE_LABEL[r.type];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div>
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          {provider.businessName ?? "Unnamed provider"}
        </h1>
        {provider.bio ? (
          <p className="mt-2 text-sm" style={{ color: "var(--home-text-muted)" }}>
            {provider.bio}
          </p>
        ) : null}
        <div className="mt-2 flex items-center gap-2">
          <Badge tone={STATUS_TONE[provider.overallVerificationStatus]}>
            {STATUS_LABEL[provider.overallVerificationStatus]}
          </Badge>
          <Badge tone={provider.isListable ? "success" : "neutral"}>
            {provider.isListable ? "Listable" : "Not listable"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <span key={c.id} className="home-badge home-badge-neutral">
            {c.label}
          </span>
        ))}
        {specialties.map((s) => (
          <span key={s.id} className="home-badge home-badge-neutral">
            {s.label}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {records.length === 0 ? (
          <EmptyState>No verification records submitted yet.</EmptyState>
        ) : (
          records.map((record) => (
            <Card key={record.id}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{recordLabel(record)}</p>
                <Badge tone={STATUS_TONE[record.status]}>{STATUS_LABEL[record.status]}</Badge>
              </div>

              {record.rejectionReason ? (
                <p className="mt-1 text-sm" style={{ color: "var(--home-text-muted)" }}>
                  Last rejection: {record.rejectionReason}
                </p>
              ) : null}

              {record.documentObjectKey ? (
                <a
                  href={`/api/verification-documents/${record.id}/image`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm underline"
                  style={{ color: "var(--home-accent)" }}
                >
                  View submitted document
                </a>
              ) : record.type === "background_check" ? (
                <p className="mt-2 text-sm" style={{ color: "var(--home-text-muted)" }}>
                  Handled automatically through the background check partner.
                </p>
              ) : (
                <p className="mt-2 text-sm" style={{ color: "var(--home-text-muted)" }}>
                  No document submitted.
                </p>
              )}

              {record.status !== "approved" ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <form action={approveVerificationRecord}>
                    <input type="hidden" name="recordId" value={record.id} />
                    <input type="hidden" name="providerId" value={provider.id} />
                    <Button type="submit" style={{ padding: "9px 16px", fontSize: 13 }}>
                      Approve
                    </Button>
                  </form>
                  <form action={rejectVerificationRecord} className="flex items-center gap-2">
                    <input type="hidden" name="recordId" value={record.id} />
                    <input type="hidden" name="providerId" value={provider.id} />
                    <Input type="text" name="reason" placeholder="Reason (optional)" style={{ fontSize: 13 }} />
                    <Button type="submit" variant="ghost" style={{ padding: "9px 16px", fontSize: 13 }}>
                      Reject
                    </Button>
                  </form>
                </div>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
