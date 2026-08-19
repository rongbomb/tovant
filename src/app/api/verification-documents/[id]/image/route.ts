import "server-only";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { providerProfiles, verificationRecords } from "@/db/schema";
import { getSession } from "@/lib/auth/get-session";
import { storageProvider } from "@/lib/integrations/registry";

// Unlike gallery photos, these are never public — only the owning provider
// (checking their own submission) or an admin (the review queue) may ever
// see a verification document, regardless of its status.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [row] = await db
    .select({
      objectKey: verificationRecords.documentObjectKey,
      providerUserId: providerProfiles.userId,
    })
    .from(verificationRecords)
    .innerJoin(providerProfiles, eq(providerProfiles.id, verificationRecords.providerId))
    .where(eq(verificationRecords.id, id));

  if (!row || !row.objectKey) {
    return new NextResponse("Not found", { status: 404 });
  }

  const session = await getSession();
  const isOwningProvider = session?.user.id === row.providerUserId;
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  if (!isOwningProvider && !isAdmin) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = await storageProvider.getSignedReadUrl(row.objectKey);
  return NextResponse.redirect(new URL(url, req.url));
}
