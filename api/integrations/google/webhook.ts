import type { IncomingMessage, ServerResponse } from "http";
import { sql } from "../../../src/server/db";
import {
  parseBody,
  sendJson,
  sendError,
  applyCorsHeaders,
  getClientIp,
} from "../../../src/server/utils/api-handler";

const APPS_SCRIPT_SECRET =
  process.env.GOOGLE_APPS_SCRIPT_SECRET || "edam_iare_apps_script_key_2026";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed. Use POST.");
  }

  try {
    const body = await parseBody<any>(req);

    // Verify shared secret
    const incomingSecret =
      body.secret ||
      req.headers["x-webhook-secret"] ||
      (req.headers["authorization"] ? req.headers["authorization"].replace("Bearer ", "") : "");

    if (incomingSecret !== APPS_SCRIPT_SECRET) {
      const ip = getClientIp(req);
      await sql`
        INSERT INTO audit_logs (action, actor, ip_address, status, details)
        VALUES ('google_webhook_unauthorized', 'unauthorized_source', ${ip}, 'failure', '{"reason": "invalid_secret"}'::jsonb);
      `;
      return sendError(res, 401, "Unauthorized webhook secret.");
    }

    const {
      eventId,
      eventTitle,
      fullName,
      email,
      rollNumber,
      department,
      yearOfStudy,
      phone,
      answers,
    } = body;

    if (!email || !fullName) {
      return sendError(res, 400, "Missing required attendee fields (fullName, email).");
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const targetEventId = eventId || "evt_cad_summit_2026";
    const regId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Insert into Neon idempotently
    await sql`
      INSERT INTO event_registrations (
        id, event_id, event_title, full_name, email, roll_number,
        department, year_of_study, phone, answers, sync_source, submitted_at
      ) VALUES (
        ${regId},
        ${targetEventId},
        ${eventTitle || "e-DAM IARE Event"},
        ${String(fullName).trim()},
        ${cleanEmail},
        ${rollNumber ? String(rollNumber).trim() : null},
        ${department ? String(department).trim() : null},
        ${yearOfStudy ? String(yearOfStudy).trim() : null},
        ${phone ? String(phone).trim() : null},
        ${JSON.stringify(answers || {})},
        'google_forms',
        NOW()
      );
    `;

    // Increment response count
    await sql`
      UPDATE chapter_events
      SET response_count = response_count + 1, updated_at = NOW()
      WHERE id = ${targetEventId};
    `;

    const ip = getClientIp(req);
    await sql`
      INSERT INTO audit_logs (action, actor, entity_type, entity_id, ip_address, status)
      VALUES ('google_form_submission_sync', 'google_apps_script', 'event_registrations', ${regId}, ${ip}, 'success');
    `;

    return sendJson(res, 200, {
      success: true,
      message: "Registration synced successfully to Neon database",
      registrationId: regId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Webhook processing error:", err);
    return sendError(res, 500, "Webhook sync failed", message);
  }
}
