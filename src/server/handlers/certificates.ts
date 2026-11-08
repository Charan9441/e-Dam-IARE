import type { IncomingMessage, ServerResponse } from "http";
import { sql } from "../db";
import { StorageService } from "../storage/storage.service";
import {
  parseBody,
  sendJson,
  sendError,
  requireAuth,
  applyCorsHeaders,
  getClientIp,
} from "../utils/api-handler";

export async function handleCertificates(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // GET: Fetch issued certificates
  if (req.method === "GET") {
    const auth = await requireAuth(req, res, "certificates:view");
    if (!auth.authorized || !auth.user) {
      return;
    }

    try {
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const eventId = url.searchParams.get("eventId");

      let certificates;
      if (eventId) {
        certificates = await sql`
          SELECT * FROM issued_certificates
          WHERE event_id = ${eventId}
          ORDER BY issued_at DESC;
        `;
      } else {
        certificates = await sql`
          SELECT * FROM issued_certificates
          ORDER BY issued_at DESC
          LIMIT 200;
        `;
      }

      return sendJson(res, 200, {
        success: true,
        count: certificates.length,
        certificates,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return sendError(res, 500, "Database error", message);
    }
  }

  // POST: Issue new certificate
  if (req.method === "POST") {
    const auth = await requireAuth(req, res, "certificates:issue");
    if (!auth.authorized || !auth.user) {
      return;
    }

    try {
      const body = await parseBody<any>(req);
      if (!body.recipientName || !body.recipientEmail || !body.eventTitle) {
        return sendError(res, 400, "Recipient name, email, and event title are required.");
      }

      const id = body.id || `cert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const certNum =
        body.certificateNumber ||
        `EDAM-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const origin = req.headers.host ? `https://${req.headers.host}` : "https://e-dam-iare.vercel.app";
      const qrUrl = `${origin}/verify/${certNum}`;
      const storageKey = body.pdfStorageKey || `certificates/${new Date().getFullYear()}/${certNum}.pdf`;

      await sql`
        INSERT INTO issued_certificates (
          id, certificate_number, event_id, registration_id, template_id,
          recipient_name, recipient_email, recipient_roll_number, recipient_department,
          event_title, event_date, certificate_type, status, pdf_storage_key,
          pdf_file_size, qr_verification_url, issued_at, issued_by
        ) VALUES (
          ${id},
          ${certNum},
          ${body.eventId || null},
          ${body.registrationId || null},
          ${body.templateId || "tmpl_edam_participation"},
          ${String(body.recipientName).trim()},
          ${String(body.recipientEmail).toLowerCase().trim()},
          ${body.recipientRollNumber ? String(body.recipientRollNumber).trim() : ""},
          ${body.recipientDepartment || ""},
          ${String(body.eventTitle).trim()},
          ${body.eventDate || "Nov 2026"},
          ${body.certificateType || "participation"},
          'valid',
          ${storageKey},
          ${Number(body.pdfFileSize || 0)},
          ${qrUrl},
          NOW(),
          ${auth.user.username}
        );
      `;

      const ip = getClientIp(req);
      await sql`
        INSERT INTO audit_logs (action, actor, actor_role, entity_type, entity_id, ip_address, status)
        VALUES ('issue_certificate', ${auth.user.username}, ${auth.user.role}, 'issued_certificates', ${certNum}, ${ip}, 'success');
      `;

      return sendJson(res, 201, {
        success: true,
        message: "Certificate issued successfully",
        certificateNumber: certNum,
        qrVerificationUrl: qrUrl,
        storageKey,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return sendError(res, 500, "Failed to issue certificate", message);
    }
  }

  return sendError(res, 405, "Method not allowed.");
}

export async function handleCertificateVerify(req: IncomingMessage, res: ServerResponse, certNumber: string) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed. Use GET.");
  }

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

    const emailParts = cert.recipient_email.split("@");
    const maskedEmail =
      emailParts[0].length > 2
        ? `${emailParts[0].slice(0, 2)}***@${emailParts[1]}`
        : cert.recipient_email;

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

