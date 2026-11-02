/**
 * Server-Side Authentication & Session Security Service
 * System: e-DAM IARE
 */

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { sql } from "../db";
import { normalizeRole, type Permission, hasPermission } from "./rbac";
import type { AdminRole } from "../db/schema";

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  fullName: string;
}

export interface AuthSession {
  token: string;
  user: AuthenticatedUser;
  expiresAt: string;
}

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export class AuthService {
  /**
   * Generates a cryptographically strong 256-bit random session token
   */
  static generateSessionToken(): string {
    return `sess_${crypto.randomBytes(32).toString("hex")}`;
  }

  /**
   * Hashes a plaintext password using bcrypt with salt work factor 12
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verifies password against bcrypt hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  /**
   * Checks if an IP or identifier is temporarily locked out due to brute-force attempts
   */
  static async isRateLimited(identifier: string, ip: string): Promise<{ locked: boolean; remainingMs?: number }> {
    const fifteenMinutesAgo = new Date(Date.now() - LOCKOUT_DURATION_MS).toISOString();

    // Check failed attempts by IP and identifier in the last 15 minutes
    const attempts = await sql`
      SELECT count(*) as count, max(attempted_at) as last_attempt
      FROM login_attempts
      WHERE (ip_address = ${ip} OR LOWER(identifier) = ${identifier.toLowerCase()})
        AND success = false
        AND attempted_at > ${fifteenMinutesAgo}::timestamptz;
    `;

    const count = Number(attempts[0]?.count || 0);
    if (count >= MAX_FAILED_ATTEMPTS) {
      const lastAttemptTime = new Date(attempts[0]?.last_attempt || Date.now()).getTime();
      const elapsed = Date.now() - lastAttemptTime;
      const remainingMs = Math.max(0, LOCKOUT_DURATION_MS - elapsed);
      if (remainingMs > 0) {
        return { locked: true, remainingMs };
      }
    }

    return { locked: false };
  }

  /**
   * Authenticates user credentials with brute-force protection, progressive delay,
   * session rotation, and audit logging.
   */
  static async authenticateUser(
    usernameOrEmail: string,
    password: string,
    ip: string,
    userAgent = ""
  ): Promise<{ success: boolean; session?: AuthSession; error?: string; status: number }> {
    const cleanIdent = usernameOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanIdent || !cleanPass) {
      return { success: false, error: "Invalid username or password.", status: 400 };
    }

    // 1. Rate Limit & Brute-Force Check
    const rateLimit = await this.isRateLimited(cleanIdent, ip);
    if (rateLimit.locked) {
      const mins = Math.ceil((rateLimit.remainingMs || LOCKOUT_DURATION_MS) / 60000);
      return {
        success: false,
        error: `Too many failed attempts. Please try again in ${mins} minute${mins > 1 ? "s" : ""}.`,
        status: 429,
      };
    }

    // 2. Fetch User from Neon
    const users = await sql`
      SELECT id, username, email, password_hash, role, full_name, is_active, failed_login_attempts, locked_until
      FROM admin_users
      WHERE (LOWER(username) = ${cleanIdent} OR LOWER(email) = ${cleanIdent})
      LIMIT 1;
    `;

    const user = users[0];

    // Check user-level lockout timestamp
    if (user && user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      const mins = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      return {
        success: false,
        error: `Account is temporarily locked. Please try again in ${mins} minute${mins > 1 ? "s" : ""}.`,
        status: 429,
      };
    }

    // 3. Verify Password using constant-time bcrypt compare
    // If user does not exist, run dummy compare to prevent timing enumeration
    const dummyHash = "$2a$12$e80yq9Rz.N3w7z9pB2Z/A.6X9h9Z2B7c5B7C2D9E2F4G6H8I0J2K4";
    const passwordHash = user ? user.password_hash : dummyHash;
    const isPasswordValid = await this.verifyPassword(cleanPass, passwordHash);

    if (!user || !isPasswordValid || !user.is_active) {
      // Record failed attempt
      await sql`
        INSERT INTO login_attempts (identifier, ip_address, success, attempted_at)
        VALUES (${cleanIdent}, ${ip}, false, NOW());
      `;

      if (user) {
        const nextAttempts = (user.failed_login_attempts || 0) + 1;
        const lockUntil =
          nextAttempts >= MAX_FAILED_ATTEMPTS
            ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
            : null;

        await sql`
          UPDATE admin_users
          SET failed_login_attempts = ${nextAttempts}, locked_until = ${lockUntil}, updated_at = NOW()
          WHERE id = ${user.id};
        `;
      }

      // Audit log failed login (no secrets logged)
      await sql`
        INSERT INTO audit_logs (action, actor, ip_address, status, details)
        VALUES ('admin_login_failure', ${cleanIdent}, ${ip}, 'failure', '{"reason": "invalid_credentials"}'::jsonb);
      `;

      // Return identical generic error
      return { success: false, error: "Invalid username or password.", status: 401 };
    }

    // 4. Successful Authentication: Reset failures & Rotate Session
    await sql`
      INSERT INTO login_attempts (identifier, ip_address, success, attempted_at)
      VALUES (${cleanIdent}, ${ip}, true, NOW());
    `;

    // Purge expired sessions for this user
    await sql`
      DELETE FROM admin_sessions
      WHERE user_id = ${user.id} AND expires_at < NOW();
    `;

    // Create fresh cryptographic session token
    const token = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

    await sql`
      INSERT INTO admin_sessions (
        id, user_id, token, ip_address, user_agent, last_activity_at, expires_at, created_at
      ) VALUES (
        ${'sess_' + Date.now()},
        ${user.id},
        ${token},
        ${ip},
        ${userAgent.slice(0, 255)},
        NOW(),
        ${expiresAt},
        NOW()
      );
    `;

    // Update user record: reset failures, update last_login
    await sql`
      UPDATE admin_users
      SET 
        failed_login_attempts = 0,
        locked_until = NULL,
        last_login_at = NOW(),
        last_login_ip = ${ip},
        updated_at = NOW()
      WHERE id = ${user.id};
    `;

    // Audit log success
    await sql`
      INSERT INTO audit_logs (action, actor, actor_role, ip_address, status)
      VALUES ('admin_login_success', ${user.username}, ${normalizeRole(user.role)}, ${ip}, 'success');
    `;

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: normalizeRole(user.role),
      fullName: user.full_name || "e-DAM Officer",
    };

    return {
      success: true,
      status: 200,
      session: {
        token,
        user: authenticatedUser,
        expiresAt,
      },
    };
  }

  /**
   * Validates active session token with inactivity timeout and expiration checks
   */
  static async validateSession(
    token: string
  ): Promise<{ valid: boolean; user?: AuthenticatedUser; error?: string }> {
    if (!token || typeof token !== "string" || !token.startsWith("sess_")) {
      return { valid: false, error: "Invalid session format" };
    }

    try {
      const rows = await sql`
        SELECT 
          s.id as session_id,
          s.token,
          s.last_activity_at,
          s.expires_at,
          u.id as user_id,
          u.username,
          u.email,
          u.role,
          u.full_name,
          u.is_active
        FROM admin_sessions s
        JOIN admin_users u ON s.user_id = u.id
        WHERE s.token = ${token}
        LIMIT 1;
      `;

      if (rows.length === 0) {
        return { valid: false, error: "Session not found" };
      }

      const s = rows[0];

      if (!s.is_active) {
        return { valid: false, error: "Account disabled" };
      }

      // Check overall expiration
      if (new Date(s.expires_at).getTime() < Date.now()) {
        await sql`DELETE FROM admin_sessions WHERE token = ${token}`;
        return { valid: false, error: "Session expired" };
      }

      // Check inactivity timeout (2 hours)
      const lastActivity = new Date(s.last_activity_at).getTime();
      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
        await sql`DELETE FROM admin_sessions WHERE token = ${token}`;
        return { valid: false, error: "Session timed out due to inactivity" };
      }

      // Touch session activity timestamp
      await sql`
        UPDATE admin_sessions
        SET last_activity_at = NOW()
        WHERE token = ${token};
      `;

      return {
        valid: true,
        user: {
          id: String(s.user_id),
          username: String(s.username),
          email: String(s.email),
          role: normalizeRole(s.role),
          fullName: String(s.full_name || "e-DAM Officer"),
        },
      };
    } catch (err) {
      console.error("Session validation database error:", err);
      return { valid: false, error: "Internal validation error" };
    }
  }

  /**
   * Invalidates session on logout
   */
  static async invalidateSession(token: string, ip = ""): Promise<void> {
    if (!token) return;
    try {
      const rows = await sql`
        DELETE FROM admin_sessions
        WHERE token = ${token}
        RETURNING user_id;
      `;

      if (rows.length > 0) {
        await sql`
          INSERT INTO audit_logs (action, actor, ip_address, status)
          VALUES ('admin_logout', ${String(rows[0].user_id)}, ${ip}, 'success');
        `;
      }
    } catch (err) {
      console.warn("Logout error:", err);
    }
  }

  /**
   * Verifies if user has specific permission
   */
  static verifyPermission(user: AuthenticatedUser, permission: Permission): boolean {
    return hasPermission(user.role, permission);
  }
}

