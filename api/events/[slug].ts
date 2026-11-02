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

  // Extract slug from URL: /api/events/some-slug or query param
  const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const slugOrId = pathParts[pathParts.length - 1] || url.searchParams.get("slug");

  if (!slugOrId) {
    return sendError(res, 400, "Event slug or ID is required.");
  }

  // GET: Fetch event by slug or ID (Public)
  if (req.method === "GET") {
    try {
      const rows = await sql`
        SELECT * FROM chapter_events
        WHERE (slug = ${slugOrId} OR id = ${slugOrId}) AND is_archived = false
        LIMIT 1;
      `;

      if (rows.length === 0) {
        return sendError(res, 404, "Event not found.");
      }

      return sendJson(res, 200, {
        success: true,
        event: rows[0],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return sendError(res, 500, "Database error", message);
    }
  }

  // PUT: Update event (Requires 'events:edit')
  if (req.method === "PUT") {
    const auth = await requireAuth(req, res, "events:edit");
    if (!auth.authorized || !auth.user) {
      return;
    }

    try {
      const body = await parseBody<any>(req);
      await sql`
        UPDATE chapter_events SET
          title = COALESCE(${body.title}, title),
          tagline = COALESCE(${body.tagline}, tagline),
          category = COALESCE(${body.category}, category),
          status = COALESCE(${body.status}, status),
          date = COALESCE(${body.date}, date),
          time = COALESCE(${body.time}, time),
          venue = COALESCE(${body.venue}, venue),
          mode = COALESCE(${body.mode}, mode),
          description = COALESCE(${body.description}, description),
          registration_deadline = COALESCE(${body.registrationDeadline || body.registration_deadline}, registration_deadline),
          registration_open = COALESCE(${body.registrationOpen}, registration_open),
          registration_url = COALESCE(${body.registrationUrl || body.registration_url}, registration_url),
          google_form_id = COALESCE(${body.googleFormId || body.google_form_id}, google_form_id),
          google_form_url = COALESCE(${body.googleFormUrl || body.google_form_url}, google_form_url),
          google_form_edit_url = COALESCE(${body.googleFormEditUrl || body.google_form_edit_url}, google_form_edit_url),
          capacity = COALESCE(${body.capacity ? Number(body.capacity) : null}, capacity),
          banner_image = COALESCE(${body.bannerImage || body.banner_image}, banner_image),
          featured = COALESCE(${body.featured}, featured),
          updated_at = NOW()
        WHERE slug = ${slugOrId} OR id = ${slugOrId};
      `;

      const ip = getClientIp(req);
      await sql`
        INSERT INTO audit_logs (action, actor, actor_role, entity_type, entity_id, ip_address, status)
        VALUES ('update_event', ${auth.user.username}, ${auth.user.role}, 'chapter_events', ${slugOrId}, ${ip}, 'success');
      `;

      return sendJson(res, 200, {
        success: true,
        message: "Event updated successfully",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return sendError(res, 500, "Failed to update event", message);
    }
  }

  // DELETE: Delete / Archive event (Requires 'events:delete')
  if (req.method === "DELETE") {
    const auth = await requireAuth(req, res, "events:delete");
    if (!auth.authorized || !auth.user) {
      return;
    }

    try {
      await sql`
        UPDATE chapter_events
        SET is_archived = true, updated_at = NOW()
        WHERE slug = ${slugOrId} OR id = ${slugOrId};
      `;

      const ip = getClientIp(req);
      await sql`
        INSERT INTO audit_logs (action, actor, actor_role, entity_type, entity_id, ip_address, status)
        VALUES ('archive_event', ${auth.user.username}, ${auth.user.role}, 'chapter_events', ${slugOrId}, ${ip}, 'success');
      `;

      return sendJson(res, 200, {
        success: true,
        message: "Event archived successfully",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return sendError(res, 500, "Failed to archive event", message);
    }
  }

  return sendError(res, 405, "Method not allowed.");
}
