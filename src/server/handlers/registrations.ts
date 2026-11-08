import type { IncomingMessage, ServerResponse } from "http";
import { sql } from "../db";
import {
  parseBody,
  sendJson,
  sendError,
  requireAuth,
  applyCorsHeaders,
  getClientIp,
} from "../utils/api-handler";

export async function handleRegistrations(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // GET: Fetch registrations
  if (req.method === "GET") {
    const auth = await requireAuth(req, res, "registrations:view");
    if (!auth.authorized || !auth.user) {
      return;
    }

    try {
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const eventId = url.searchParams.get("eventId");

      let registrations;
      if (eventId) {
        registrations = await sql`
          SELECT id, event_id, event_title, full_name, email, roll_number, department, year_of_study, phone, answers, sync_source, submitted_at
          FROM event_registrations
          WHERE event_id = ${eventId}
          ORDER BY submitted_at DESC;
        `;
      } else {
        registrations = await sql`
          SELECT id, event_id, event_title, full_name, email, roll_number, department, year_of_study, phone, answers, sync_source, submitted_at
          FROM event_registrations
          ORDER BY submitted_at DESC
          LIMIT 200;
        `;
      }

      return sendJson(res, 200, {
        success: true,
        count: registrations.length,
        registrations,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return sendError(res, 500, "Database error", message);
    }
  }

  // POST: Record registration
  if (req.method === "POST") {
    const auth = await requireAuth(req, res, "registrations:manage");
    if (!auth.authorized || !auth.user) {
      return;
    }

    try {
      const body = await parseBody<any>(req);
      if (!body.fullName || !body.email || !body.eventId) {
        return sendError(res, 400, "Full name, email, and event ID are required.");
      }

      const id = body.id || `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      await sql`
        INSERT INTO event_registrations (
          id, event_id, event_title, full_name, email, roll_number,
          department, year_of_study, phone, answers, sync_source, submitted_at
        ) VALUES (
          ${id},
          ${body.eventId},
          ${body.eventTitle || ""},
          ${String(body.fullName).trim()},
          ${String(body.email).toLowerCase().trim()},
          ${body.rollNumber ? String(body.rollNumber).trim() : ""},
          ${body.department || ""},
          ${body.yearOfStudy || ""},
          ${body.phone || ""},
          ${JSON.stringify(body.answers || {})},
          ${body.syncSource || "direct_admin"},
          NOW()
        );
      `;

      // Increment response count
      await sql`
        UPDATE chapter_events
        SET response_count = response_count + 1, updated_at = NOW()
        WHERE id = ${body.eventId};
      `;

      const ip = getClientIp(req);
      await sql`
        INSERT INTO audit_logs (action, actor, actor_role, entity_type, entity_id, ip_address, status)
        VALUES ('manual_registration_add', ${auth.user.username}, ${auth.user.role}, 'event_registrations', ${id}, ${ip}, 'success');
      `;

      return sendJson(res, 201, {
        success: true,
        message: "Registration recorded successfully",
        registrationId: id,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return sendError(res, 500, "Failed to record registration", message);
    }
  }

  return sendError(res, 405, "Method not allowed.");
}

