import { mkdir, writeFile, unlink } from "fs/promises";
import { dirname, join } from "path";
import type { ObjectStorageProvider } from "../types";

// Writes to a gitignored local folder so verification-doc-style uploads
// can be exercised in dev without a real bucket.
const LOCAL_STORAGE_ROOT = join(process.cwd(), ".local-storage");

function localPath(key: string) {
  return join(LOCAL_STORAGE_ROOT, key);
}

export const storageStub: ObjectStorageProvider = {
  async putObject(key, body) {
    const path = localPath(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
    console.log(`[stub:storage] putObject ${key}`);
    return { key };
  },
  async getSignedReadUrl(key, expiresInSeconds = 900) {
    console.log(`[stub:storage] getSignedReadUrl ${key} (expires ${expiresInSeconds}s)`);
    // Relative, and each path segment encoded individually (not the whole
    // key) so "/" stays a path separator for the [...key] route below.
    const encodedPath = key.split("/").map(encodeURIComponent).join("/");
    return `/api/local-storage/${encodedPath}`;
  },
  async deleteObject(key) {
    try {
      await unlink(localPath(key));
    } catch {
      // already gone — fine for a dev stub
    }
    console.log(`[stub:storage] deleteObject ${key}`);
  },
};
