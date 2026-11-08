import type { IncomingMessage, ServerResponse } from "http";
import { sql } from "../db";
import { AuthService } from "../auth/auth.service";
import { normalizeRole } from "../auth/rbac";
import {
  parseBody,
  sendJson,
  sendError,
  requireAuth,
  applyCorsHeaders,
  getClientIp,
} from "../utils/api-handler";

export async function handleAdminAuditLogs(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

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

export async function handleAdminUsers(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const auth = await requireAuth(req, res, "users:manage");
  if (!auth.authorized || !auth.user) {
    return;
  }

  // GET: List all administrators
  if (req.method === "GET") {
    try {
      const users = await sql`
        SELECT id, username, email, role, full_name, is_active, last_login_at, created_at, updated_at
        FROM admin_users
        ORDER BY created_at ASC;
      `;

      return sendJson(res, 200, {
        success: true,
        count: users.length,
        users,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return sendError(res, 500, "Failed to retrieve user accounts", message);
    }
  }

  // POST: Create or update administrator role
  if (req.method === "POST") {
    try {
      const body = await parseBody<any>(req);
      const username = (body.username || "").trim().toLowerCase();
      const email = (body.email || "").trim().toLowerCase();
      const role = normalizeRole(body.role);
      const fullName = (body.fullName || "").trim();
      const password = (body.password || "").trim();

      if (!username || !email) {
        return sendError(res, 400, "Username and email are required.");
      }

      const existing = await sql`
        SELECT id FROM admin_users
        WHERE LOWER(username) = ${username} OR LOWER(email) = ${email}
        LIMIT 1;
      `;

      const ip = getClientIp(req);

      if (existing.length > 0) {
        const userId = existing[0].id;
        await sql`
          UPDATE admin_users
          SET role = ${role}, full_name = COALESCE(NULLIF(${fullName}, ''), full_name), updated_at = NOW()
          WHERE id = ${userId};
        `;

        await sql`
          INSERT INTO audit_logs (action, actor, actor_role, entity_type, entity_id, ip_address, status, details)
          VALUES ('admin_user_updated', ${auth.user.username}, ${auth.user.role}, 'admin_users', ${userId}, ${ip}, 'success', ${JSON.stringify({ role })}::jsonb);
        `;

        return sendJson(res, 200, {
          success: true,
          message: `User '${username}' role updated to ${role}`,
        });
      }

      if (!password || password.length < 8) {
        return sendError(res, 400, "A secure password of at least 8 characters is required for new users.");
      }

      const passwordHash = await AuthService.hashPassword(password);
      const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      await sql`
        INSERT INTO admin_users (
          id, username, email, password_hash, role, full_name, is_active, password_changed_at
        ) VALUES (
          ${newId},
          ${username},
          ${email},
          ${passwordHash},
          ${role},
          ${fullName || "e-DAM Administrator"},
          true,
          NOW()
        );
      `;

      await sql`
        INSERT INTO audit_logs (action, actor, actor_role, entity_type, entity_id, ip_address, status, details)
        VALUES ('admin_user_created', ${auth.user.username}, ${auth.user.role}, 'admin_users', ${newId}, ${ip}, 'success', ${JSON.stringify({ username, role })}::jsonb);
      `;

      return sendJson(res, 201, {
        success: true,
        message: `Administrator '${username}' provisioned with role ${role}.`,
        userId: newId,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return sendError(res, 500, "Failed to manage user account", message);
    }
  }

  return sendError(res, 405, "Method not allowed.");
}

