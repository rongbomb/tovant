import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ObjectStorageProvider } from "../types";

let client: S3Client | null = null;

function getClient() {
  if (!client) {
    if (!process.env.S3_REGION || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
      throw new Error("S3 credentials are not set (S3_MODE=live requires them)");
    }
    client = new S3Client({
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

function requireBucket() {
  if (!process.env.S3_BUCKET) throw new Error("S3_BUCKET is not set");
  return process.env.S3_BUCKET;
}

export const storageLive: ObjectStorageProvider = {
  async putObject(key, body, contentType) {
    await getClient().send(
      new PutObjectCommand({
        Bucket: requireBucket(),
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return { key };
  },
  async getSignedReadUrl(key, expiresInSeconds = 900) {
    return getSignedUrl(
      getClient(),
      new GetObjectCommand({ Bucket: requireBucket(), Key: key }),
      { expiresIn: expiresInSeconds },
    );
  },
  async deleteObject(key) {
    await getClient().send(
      new DeleteObjectCommand({ Bucket: requireBucket(), Key: key }),
    );
  },
};
