import type { IncomingMessage, ServerResponse } from "http";
import { sql } from "../../../src/server/db";
import { StorageService } from "../../../src/server/storage/storage.service";
import { sendJson, sendError } from "../../../src/server/utils/api-handler";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed. Use GET.");
  }

  const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const certNumber = pathParts[pathParts.length - 1] || url.searchParams.get("id");

  if (!certNumber) {
    return sendError(res, 400, "Certificate number is required.");
  }

  try {
    const rows = await sql`
      SELECT 
        c.certificate_number,
        c.recipient_name,
        c.recipient_email,
        c.recipient_roll_number,
        c.recipient_department,
        c.event_title,
        c.event_date,
        c.certificate_type,
        c.status,
        c.revoked_at,
        c.revoked_reason,
        c.pdf_storage_key,
        c.qr_verification_url,
        c.issued_at,
        t.issuer_organization
      FROM issued_certificates c
      LEFT JOIN certificate_templates t ON c.template_id = t.id
      WHERE c.certificate_number = ${certNumber} OR c.id = ${certNumber}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return sendError(res, 404, "Certificate not found or invalid.");
    }

    const cert = rows[0];

    // Mask email for privacy in public verification
    const emailParts = cert.recipient_email.split("@");
    const maskedEmail =
      emailParts[0].length > 2
        ? `${emailParts[0].slice(0, 2)}***@${emailParts[1]}`
        : cert.recipient_email;

    // Generate temporary download URL if object exists in R2
    let downloadUrl: string | null = null;
    if (cert.pdf_storage_key) {
      try {
        downloadUrl = await StorageService.createPresignedDownloadUrl(cert.pdf_storage_key, 900);
      } catch (e) {
        console.warn("Could not sign R2 download URL:", e);
      }
    }

    return sendJson(res, 200, {
      success: true,
      valid: cert.status === "valid",
      certificate: {
        certificateNumber: cert.certificate_number,
        recipientName: cert.recipient_name,
        recipientEmail: maskedEmail,
        rollNumber: cert.recipient_roll_number,
        department: cert.recipient_department,
        eventTitle: cert.event_title,
        eventDate: cert.event_date,
        type: cert.certificate_type,
        status: cert.status,
        issuerOrganization: cert.issuer_organization || "e-DAM Student Chapter, IARE",
        issuedAt: cert.issued_at,
        downloadUrl,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return sendError(res, 500, "Error verifying certificate", message);
  }
}

