import type { IncomingMessage, ServerResponse } from "http";
import { handleHealth } from "../src/server/handlers/health";
import { handleAuthLogin, handleAuthLogout, handleAuthMe } from "../src/server/handlers/auth";
import { handleEvents, handleEventBySlug } from "../src/server/handlers/events";
import { handleRegistrations } from "../src/server/handlers/registrations";
import { handleCertificates, handleCertificateVerify } from "../src/server/handlers/certificates";
import { handlePresignedUrl } from "../src/server/handlers/uploads";
import { handleGoogleCreateForm, handleGoogleWebhook } from "../src/server/handlers/google";
import { handleAdminAuditLogs, handleAdminUsers } from "../src/server/handlers/admin";
import { sendError, applyCorsHeaders } from "../src/server/utils/api-handler";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
  let pathname = url.pathname.replace(/\/+$/, "");

  if (!pathname.startsWith("/api")) {
    pathname = "/api" + (pathname.startsWith("/") ? pathname : "/" + pathname);
  }

  try {
    // 1. Health check
    if (pathname === "/api/health" || pathname === "/api") {
      return await handleHealth(req, res);
    }

    // 2. Auth routes
    if (pathname === "/api/auth/login") {
      return await handleAuthLogin(req, res);
    }
    if (pathname === "/api/auth/logout") {
      return await handleAuthLogout(req, res);
    }
    if (pathname === "/api/auth/me") {
      return await handleAuthMe(req, res);
    }

    // 3. Events routes
    if (pathname === "/api/events") {
      return await handleEvents(req, res);
    }
    if (pathname.startsWith("/api/events/")) {
      const slugOrId = decodeURIComponent(pathname.replace("/api/events/", ""));
      return await handleEventBySlug(req, res, slugOrId);
    }

    // 4. Registrations routes
    if (pathname === "/api/registrations") {
      return await handleRegistrations(req, res);
    }

    // 5. Certificates routes
    if (pathname === "/api/certificates") {
      return await handleCertificates(req, res);
    }
    if (pathname.startsWith("/api/certificates/verify/")) {
      const certId = decodeURIComponent(pathname.replace("/api/certificates/verify/", ""));
      return await handleCertificateVerify(req, res, certId);
    }

    // 6. Uploads routes
    if (pathname === "/api/uploads/presigned-url") {
      return await handlePresignedUrl(req, res);
    }

    // 7. Google Integrations routes
    if (pathname === "/api/integrations/google/create-form") {
      return await handleGoogleCreateForm(req, res);
    }
    if (pathname === "/api/integrations/google/webhook") {
      return await handleGoogleWebhook(req, res);
    }

    // 8. Admin routes
    if (pathname === "/api/admin/audit-logs") {
      return await handleAdminAuditLogs(req, res);
    }
    if (pathname === "/api/admin/users") {
      return await handleAdminUsers(req, res);
    }

    return sendError(res, 404, `API route not found: ${pathname}`);
  } catch (err: unknown) {
    console.error(`Unhandled API exception for ${pathname}:`, err);
    return sendError(res, 500, "Internal Server Error");
  }
}

