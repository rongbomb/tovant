import "server-only";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { providerGalleryPhotos, providerProfiles } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { storageProvider } from "@/lib/integrations/registry";

// Approved photos are public (a profile page visitor has no session).
// Pending/rejected photos are only visible to the owning provider
// (reviewing their own submission) or an admin (moderation queue).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [row] = await db
    .select({
      objectKey: providerGalleryPhotos.objectKey,
      status: providerGalleryPhotos.status,
      providerUserId: providerProfiles.userId,
    })
    .from(providerGalleryPhotos)
    .innerJoin(providerProfiles, eq(providerProfiles.id, providerGalleryPhotos.providerId))
    .where(eq(providerGalleryPhotos.id, id));

  if (!row) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (row.status !== "approved") {
    const session = await getSession();
    const isOwningProvider = session?.user.id === row.providerUserId;
    const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
    if (!isOwningProvider && !isAdmin) {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  const url = await storageProvider.getSignedReadUrl(row.objectKey);
  return NextResponse.redirect(new URL(url, req.url));
}
