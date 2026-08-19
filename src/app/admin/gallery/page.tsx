import { eq } from "drizzle-orm";
import Image from "next/image";
import { db } from "@/db";
import { providerGalleryPhotos, providerProfiles } from "@/db/schema";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { approveGalleryPhoto, rejectGalleryPhoto } from "./actions";

export default async function AdminGalleryPage() {
  const pendingPhotos = await db
    .select({
      id: providerGalleryPhotos.id,
      caption: providerGalleryPhotos.caption,
      createdAt: providerGalleryPhotos.createdAt,
      businessName: providerProfiles.businessName,
    })
    .from(providerGalleryPhotos)
    .innerJoin(providerProfiles, eq(providerProfiles.id, providerGalleryPhotos.providerId))
    .where(eq(providerGalleryPhotos.status, "pending"))
    .orderBy(providerGalleryPhotos.createdAt);

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="home-serif" style={{ fontSize: 28 }}>
          Gallery moderation
        </h1>
        <p className="home-lede" style={{ marginTop: 6, fontSize: 14 }}>
          Provider-uploaded &quot;recent work&quot; photos awaiting approval before they go public.
        </p>
      </div>

      {pendingPhotos.length === 0 ? (
        <EmptyState>Nothing pending review.</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pendingPhotos.map((photo) => (
            <Card key={photo.id} className="flex flex-col gap-2">
              <div
                className="relative aspect-square overflow-hidden"
                style={{ borderRadius: 14, border: "1px solid var(--home-line)", background: "var(--home-tint)" }}
              >
                <Image
                  src={`/api/gallery-photos/${photo.id}/image`}
                  alt={photo.caption ?? "Pending review photo"}
                  fill
                  sizes="300px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <p className="text-sm">{photo.businessName ?? "Unnamed provider"}</p>
              {photo.caption ? (
                <p className="text-xs" style={{ color: "var(--home-text-muted)" }}>
                  {photo.caption}
                </p>
              ) : null}
              <div className="flex gap-2">
                <form action={approveGalleryPhoto}>
                  <input type="hidden" name="id" value={photo.id} />
                  <Button type="submit" style={{ padding: "9px 16px", fontSize: 13 }}>
                    Approve
                  </Button>
                </form>
                <form action={rejectGalleryPhoto} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={photo.id} />
                  <Input type="text" name="reason" placeholder="Reason (optional)" style={{ fontSize: 13 }} />
                  <Button type="submit" variant="ghost" style={{ padding: "9px 16px", fontSize: 13 }}>
                    Reject
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
