import type { IncomingMessage, ServerResponse } from "http";
import { sql } from "../../src/server/db";
import {
  sendJson,
  sendError,
  requireAuth,
  applyCorsHeaders,
} from "../../src/server/utils/api-handler";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Requires 'audit:view' permission (SUPER_ADMIN only)
  const auth = await requireAuth(req, res, "audit:view");
  if (!auth.authorized || !auth.user) {
    return;
  }

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed. Use GET.");
  }

  try {
    const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    const limit = Math.min(Number(url.searchParams.get("limit") || 100), 250);

    const logs = await sql`
      SELECT id, action, actor, actor_role, entity_type, entity_id, ip_address, status, details, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT ${limit};
    `;

    return sendJson(res, 200, {
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return sendError(res, 500, "Failed to retrieve audit logs", message);
  }
}

