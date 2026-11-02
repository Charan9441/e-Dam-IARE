import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function getR2BucketName(): string {
  return process.env.R2_BUCKET_NAME || "edam-iare-media";
}

export function getR2Endpoint(): string {
  const accountId = process.env.R2_ACCOUNT_ID || "";
  return process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
}

export const R2_BUCKET_NAME = getR2BucketName();
export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
export const R2_ENDPOINT = getR2Endpoint();

let s3ClientInstance: S3Client | null = null;

/**
 * Returns a cached S3Client instance configured for Cloudflare R2
 */
export function getR2Client(): S3Client {
  if (!s3ClientInstance) {
    const endpoint = getR2Endpoint();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";

    s3ClientInstance = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3ClientInstance;
}

/**
 * Health check verifying connectivity and access to Cloudflare R2 bucket
 */
export async function getR2Health(): Promise<{
  connected: boolean;
  bucket: string;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const client = getR2Client();
    await client.send(new HeadBucketCommand({ Bucket: R2_BUCKET_NAME }));
    return {
      connected: true,
      bucket: R2_BUCKET_NAME,
      latencyMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      bucket: R2_BUCKET_NAME,
      latencyMs: Date.now() - start,
      error: message,
    };
  }
}

export { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, getSignedUrl };

