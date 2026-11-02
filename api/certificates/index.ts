import type { IncomingMessage, ServerResponse } from "http";
import { sql } from "../../src/server/db";
import {
  parseBody,
  sendJson,
  sendError,
  requireAuth,
  applyCorsHeaders,
  getClientIp,
} from "../../src/server/utils/api-handler";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // GET: Fetch issued certificates (Requires 'certificates:view')
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

  // POST: Issue new certificate (Requires 'certificates:issue')
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

      // Audit log with actor and role
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
