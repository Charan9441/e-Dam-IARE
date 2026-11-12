import {
  getR2Client,
  getR2BucketName,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  getSignedUrl,
} from "./r2.ts";
import { sql } from "../db/index.ts";

export interface StorageUploadOptions {
  fileName?: string;
  category?: "banners" | "certificates" | "media" | "documents";
  entityType?: string;
  entityId?: string;
  maxSizeBytes?: number;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_BANNER_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CERT_SIZE = 10 * 1024 * 1024; // 10MB

export class StorageService {
  /**
   * Generates a unique, collision-resistant storage key
   */
  static generateStorageKey(category: string, filename: string): string {
    const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const datePrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
    return `${category}/${datePrefix}/${timestamp}_${randomHex}_${cleanName}`;
  }

  /**
   * Validates MIME type against whitelist
   */
  static validateContentType(contentType: string): boolean {
    return ALLOWED_CONTENT_TYPES.includes(contentType.toLowerCase());
  }

  /**
   * Validates file size against limits
   */
  static validateFileSize(sizeBytes: number, category: string): boolean {
    const limit = category === "banners" ? MAX_BANNER_SIZE : MAX_CERT_SIZE;
    return sizeBytes > 0 && sizeBytes <= limit;
  }

  /**
   * Uploads an in-memory buffer or Uint8Array directly to Cloudflare R2
   * and logs its metadata to Neon PostgreSQL.
   */
  static async uploadBuffer(
    buffer: Buffer | Uint8Array,
    storageKey: string,
    contentType: string,
    options: StorageUploadOptions = {}
  ): Promise<{ success: boolean; storageKey: string; size: number }> {
    const client = getR2Client();
    const size = buffer.length;

    if (!this.validateContentType(contentType)) {
      throw new Error(`Disallowed content type: ${contentType}`);
    }

    if (!this.validateFileSize(size, options.category || "media")) {
      throw new Error(`File size (${size} bytes) exceeds the allowed limit.`);
    }

    const bucket = getR2BucketName();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: buffer,
      ContentType: contentType,
    });

    await client.send(command);

    // Persist in Neon database file_metadata
    try {
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      await sql`
        INSERT INTO file_metadata (
          id, storage_key, bucket, file_name, content_type,
          file_size_bytes, category, entity_type, entity_id, created_at
        ) VALUES (
          ${fileId},
          ${storageKey},
          ${bucket},
          ${options.fileName || storageKey.split("/").pop() || "file"},
          ${contentType},
          ${size},
          ${options.category || "media"},
          ${options.entityType || null},
          ${options.entityId || null},
          NOW()
        )
        ON CONFLICT (storage_key) DO UPDATE SET
          file_size_bytes = EXCLUDED.file_size_bytes,
          content_type = EXCLUDED.content_type;
      `;
    } catch (err) {
      console.warn("Could not insert file_metadata row in Neon:", err);
    }

    return {
      success: true,
      storageKey,
      size,
    };
  }

  /**
   * Generates a presigned URL allowing the client to upload directly to R2
   */
  static async createPresignedUploadUrl(
    category: "banners" | "certificates" | "media" | "documents",
    filename: string,
    contentType: string,
    expiresIn = 900 // 15 minutes
  ): Promise<PresignedUploadResult> {
    if (!this.validateContentType(contentType)) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const storageKey = this.generateStorageKey(category, filename);
    const client = getR2Client();

    const bucket = getR2BucketName();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn });

    return {
      uploadUrl,
      storageKey,
      expiresInSeconds: expiresIn,
    };
  }

  /**
   * Generates a temporary presigned download URL for private files
   */
  static async createPresignedDownloadUrl(
    storageKey: string,
    expiresIn = 900 // 15 minutes
  ): Promise<string> {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: storageKey,
    });

    return await getSignedUrl(client, command, { expiresIn });
  }

  /**
   * Deletes an object from Cloudflare R2 and removes its record from Neon
   */
  static async deleteObject(storageKey: string): Promise<boolean> {
    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: getR2BucketName(),
      Key: storageKey,
    });

    await client.send(command);

    try {
      await sql`DELETE FROM file_metadata WHERE storage_key = ${storageKey}`;
    } catch (err) {
      console.warn("Could not remove file_metadata row in Neon:", err);
    }

    return true;
  }
}

