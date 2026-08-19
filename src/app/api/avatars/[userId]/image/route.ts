import "server-only";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { storageProvider } from "@/lib/integrations/registry";

// Public, unauthenticated — avatars are meant to be visible wherever a
// name shows (messages, reviews, provider cards), unlike gallery photos
// or verification documents, so there's no ownership/status gate here.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, userId) });
  if (!profile?.avatarObjectKey) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = await storageProvider.getSignedReadUrl(profile.avatarObjectKey);
  return NextResponse.redirect(new URL(url, req.url));
}
