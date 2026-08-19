import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { jobs, providerProfiles, reviews } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { requireOwnership, type SessionUser } from "@/lib/security/ownership";
import { RatingInput } from "@/components/ui/rating-input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { saveReview } from "./actions";

const REVIEWABLE_STATUSES = new Set(["completed", "disputed"]);

export default async function OwnerJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) notFound();

  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });
  if (!job) notFound();
  await requireOwnership(job, session.user as SessionUser);

  const [provider, existingReview] = await Promise.all([
    db.query.providerProfiles.findFirst({ where: eq(providerProfiles.id, job.providerId) }),
    db.query.reviews.findFirst({ where: eq(reviews.jobId, job.id) }),
  ]);

  const canReview = REVIEWABLE_STATUSES.has(job.status) && job.ownerId === session.user.id;

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          {provider?.businessName ?? "Job"}
        </h1>
        <p
          className="mt-1 text-xs uppercase tracking-widest"
          style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}
        >
          {job.status.replace("_", " ")} · Scheduled {new Date(job.scheduledAt).toLocaleDateString()}
        </p>
        <Button href={`/owner/messages?jobId=${job.id}`} variant="ghost" style={{ marginTop: 12 }}>
          Message provider
        </Button>
      </div>

      {canReview ? (
        <Card className="flex flex-col gap-4">
          <h2 className="home-serif" style={{ fontSize: 18 }}>
            {existingReview ? "Edit your review" : "Leave a review"}
          </h2>
          <form action={saveReview} className="flex flex-col gap-4">
            <input type="hidden" name="jobId" value={job.id} />
            <RatingInput name="rating" defaultValue={existingReview?.rating ?? 0} />
            <Textarea
              name="comment"
              required
              defaultValue={existingReview?.comment ?? ""}
              placeholder="How did the job go?"
            />
            <Button type="submit" style={{ alignSelf: "flex-start" }}>
              {existingReview ? "Save changes" : "Submit review"}
            </Button>
            {existingReview?.editedAt ? (
              <p className="text-xs" style={{ fontFamily: "var(--home-font-mono)", color: "var(--home-text-muted)" }}>
                Last edited {new Date(existingReview.editedAt).toLocaleDateString()}
              </p>
            ) : null}
          </form>
        </Card>
      ) : null}
    </div>
  );
}
