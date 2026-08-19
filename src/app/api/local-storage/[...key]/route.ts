import "server-only";
import { readFile } from "fs/promises";
import { join, normalize } from "path";
import type { NextRequest } from "next/server";

// Dev-only counterpart to src/lib/integrations/storage/s3.stub.ts's
// putObject — serves whatever the stub wrote to .local-storage/, since
// nothing else in Next.js exposes that (gitignored, outside public/).
// Swapped out entirely once S3_MODE=live points getSignedReadUrl at a
// real bucket.
const LOCAL_STORAGE_ROOT = join(process.cwd(), ".local-storage");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const relativePath = normalize(key.join("/"));
  const resolved = join(LOCAL_STORAGE_ROOT, relativePath);

  if (!resolved.startsWith(LOCAL_STORAGE_ROOT)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await readFile(resolved);
    const ext = relativePath.slice(relativePath.lastIndexOf(".")).toLowerCase();
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
