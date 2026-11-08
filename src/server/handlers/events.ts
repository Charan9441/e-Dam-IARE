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

export async function handleEvents(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // GET: Public list of events
  if (req.method === "GET") {
    try {
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const status = url.searchParams.get("status");
      const category = url.searchParams.get("category");

      let events;
      if (status && category) {
        events = await sql`
          SELECT * FROM chapter_events 
          WHERE is_archived = false AND status = ${status} AND category = ${category}
          ORDER BY date ASC, created_at DESC;
        `;
      } else if (status) {
        events = await sql`
          SELECT * FROM chapter_events 
          WHERE is_archived = false AND status = ${status}
          ORDER BY date ASC, created_at DESC;
        `;
      } else {
        events = await sql`
          SELECT * FROM chapter_events 
          WHERE is_archived = false
          ORDER BY date ASC, created_at DESC;
        `;
      }

      return sendJson(res, 200, {
        success: true,
        count: events.length,
        events,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("GET /api/events error:", err);
      return sendError(res, 500, "Failed to retrieve events", message);
    }
  }

  // POST: Admin create new event
  if (req.method === "POST") {
    const auth = await requireAuth(req, res, "events:create");
    if (!auth.authorized || !auth.user) {
      return;
    }

    try {
      const body = await parseBody<any>(req);
      if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
        return sendError(res, 400, "Event title is required.");
      }

      const id = body.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const slug =
        body.slug ||
        body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      await sql`
        INSERT INTO chapter_events (
          id, slug, title, tagline, category, status, date, time, venue, mode,
          description, detailed_overview, prerequisites, takeaways, speakers,
          registration_deadline, registration_open, registration_url, google_form_id,
          google_form_url, google_form_edit_url, form_status, capacity, featured,
          is_archived, created_at, updated_at
        ) VALUES (
          ${id},
          ${slug},
          ${body.title.trim()},
          ${body.tagline || ""},
          ${body.category || "Workshop"},
          ${body.status || "upcoming"},
          ${body.date || "TBA"},
          ${body.time || "10:00 AM"},
          ${body.venue || "IARE Campus"},
          ${body.mode || "offline"},
          ${body.description || ""},
          ${JSON.stringify(body.detailedOverview || body.detailed_overview || [])},
          ${JSON.stringify(body.prerequisites || [])},
          ${JSON.stringify(body.takeaways || [])},
          ${JSON.stringify(body.speakers || [])},
          ${body.registrationDeadline || body.registration_deadline || ""},
          ${Boolean(body.registrationOpen !== false)},
          ${body.registrationUrl || body.registration_url || ""},
          ${body.googleFormId || body.google_form_id || ""},
          ${body.googleFormUrl || body.google_form_url || ""},
          ${body.googleFormEditUrl || body.google_form_edit_url || ""},
          ${body.formStatus || "active"},
          ${Number(body.capacity || 100)},
          ${Boolean(body.featured)},
          false,
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          tagline = EXCLUDED.tagline,
          category = EXCLUDED.category,
          status = EXCLUDED.status,
          date = EXCLUDED.date,
          time = EXCLUDED.time,
          venue = EXCLUDED.venue,
          mode = EXCLUDED.mode,
          description = EXCLUDED.description,
          updated_at = NOW();
      `;

      const ip = getClientIp(req);
      await sql`
        INSERT INTO audit_logs (action, actor, actor_role, entity_type, entity_id, ip_address, status)
        VALUES ('create_event', ${auth.user.username}, ${auth.user.role}, 'chapter_events', ${id}, ${ip}, 'success');
      `;

      return sendJson(res, 201, {
        success: true,
        message: "Event created successfully",
        eventId: id,
        slug,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("POST /api/events error:", err);
      return sendError(res, 500, "Failed to create event", message);
    }
  }

  return sendError(res, 405, "Method not allowed.");
}

export async function handleEventBySlug(req: IncomingMessage, res: ServerResponse, slugOrId: string) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

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

  // PUT: Update event
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

  // DELETE: Delete / Archive event
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

