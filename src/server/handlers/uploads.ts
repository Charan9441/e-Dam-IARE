import type { IncomingMessage, ServerResponse } from "http";
import { StorageService } from "../storage/storage.service";
import {
  parseBody,
  sendJson,
  sendError,
  requireAuth,
  applyCorsHeaders,
} from "../utils/api-handler";

export async function handlePresignedUrl(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed. Use POST.");
  }

  const auth = await requireAuth(req, res, "uploads:manage");
  if (!auth.authorized || !auth.user) {
    return;
  }

  try {
    const body = await parseBody<{
      category?: "banners" | "certificates" | "media" | "documents";
      filename?: string;
      contentType?: string;
    }>(req);

    const category = body.category || "media";
    const filename = body.filename || `upload_${Date.now()}.png`;
    const contentType = body.contentType || "image/png";

    if (!StorageService.validateContentType(contentType)) {
      return sendError(
        res,
        400,
        `Unsupported content type: ${contentType}. Allowed: PDF, PNG, JPG, WEBP, SVG.`
      );
    }

    const result = await StorageService.createPresignedUploadUrl(
      category,
      filename,
      contentType,
      900
    );

    return sendJson(res, 200, {
      success: true,
      uploadUrl: result.uploadUrl,
      storageKey: result.storageKey,
      expiresInSeconds: result.expiresInSeconds,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Presigned URL error:", err);
    return sendError(res, 500, "Failed to create presigned upload URL", message);
  }
}

