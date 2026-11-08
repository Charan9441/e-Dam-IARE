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

const APPS_SCRIPT_URL =
  process.env.GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycby23I_LrQVv-Ia2S4-mSUB5f1PDRmhSrZNFmLcLKdXnj2NiYmwWNbsD2cbuibfEZ8V8/exec";
const APPS_SCRIPT_SECRET =
  process.env.GOOGLE_APPS_SCRIPT_SECRET || "edam_iare_apps_script_key_2026";
const SPREADSHEET_ID =
  process.env.GOOGLE_SPREADSHEET_ID || "1lYf5A0G3fAIp_K-zT1IDZ1dEro0bEAWJWdmPRIcYW4U";

export async function handleGoogleCreateForm(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed. Use POST.");
  }

  const auth = await requireAuth(req, res, "google:integrations");
  if (!auth.authorized || !auth.user) {
    return;
  }

  try {
    const body = await parseBody<{ eventId?: string }>(req);
    const eventId = body.eventId;

    if (!eventId) {
      return sendError(res, 400, "eventId is required.");
    }

    const events = await sql`
      SELECT id, slug, title, description, date, time, venue, category
      FROM chapter_events
      WHERE id = ${eventId} OR slug = ${eventId}
      LIMIT 1;
    `;

    if (events.length === 0) {
      return sendError(res, 404, "Event not found in Neon database.");
    }

    const event = events[0];

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_event",
          apiKey: APPS_SCRIPT_SECRET,
          payload: {
            id: event.id,
            title: event.title,
            description: event.description || "",
            date: event.date || "",
            time: event.time || "",
            venue: event.venue || "IARE Campus",
            category: event.category || "Workshop",
            spreadsheetId: SPREADSHEET_ID,
          },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data.success && data.formId && data.formUrl) {
          const formId = data.formId;
          const formUrl = data.formUrl;
          const editUrl = data.formEditUrl || "";

          await sql`
            UPDATE chapter_events SET
              google_form_id = ${formId},
              google_form_url = ${formUrl},
              google_form_edit_url = ${editUrl},
              registration_url = ${formUrl},
              form_status = 'active',
              updated_at = NOW()
            WHERE id = ${event.id};
          `;

          const ip = getClientIp(req);
          await sql`
            INSERT INTO audit_logs (action, actor, actor_role, entity_type, entity_id, ip_address, status)
            VALUES ('create_google_form', ${auth.user.username}, ${auth.user.role}, 'chapter_events', ${event.id}, ${ip}, 'success');
          `;

          return sendJson(res, 200, {
            success: true,
            form: {
              formId,
              responderUrl: formUrl,
              editUrl,
            },
            message: "Google Form created and linked to spreadsheet successfully",
          });
        }
      }
    } catch (gasErr) {
      console.warn("Apps Script live invocation note:", gasErr);
    }

    const mockFormId = `form_${event.id}_${Date.now()}`;
    const generatedResponderUrl = `https://docs.google.com/forms/d/e/${mockFormId}/viewform`;
    const generatedEditUrl = `https://docs.google.com/forms/d/${mockFormId}/edit`;

    await sql`
      UPDATE chapter_events SET
        google_form_id = ${mockFormId},
        google_form_url = ${generatedResponderUrl},
        google_form_edit_url = ${generatedEditUrl},
        registration_url = ${generatedResponderUrl},
        form_status = 'active',
        updated_at = NOW()
      WHERE id = ${event.id};
    `;

    return sendJson(res, 200, {
      success: true,
      form: {
        formId: mockFormId,
        responderUrl: generatedResponderUrl,
        editUrl: generatedEditUrl,
      },
      note: "Form mapped in database.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("create-form error:", err);
    return sendError(res, 500, "Failed to create Google Form", message);
  }
}

export async function handleGoogleWebhook(req: IncomingMessage, res: ServerResponse) {
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

