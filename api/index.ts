/**
 * e-DAM IARE — Centralized Serverless API Router
 * Single Serverless Function Entry Point for Vercel Hobby Plan Compliance (1/12 functions)
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ==============================================================================
// 1. CONFIGURATION & CLIENT INITIALIZATION (FAIL-CLOSED, NO HARDCODED SECRETS)
// ==============================================================================

type SqlClient = ReturnType<typeof neon<false, false>>;

let cachedDbUrl = "";
let cachedSql: SqlClient | null = null;

function getDbUrl(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DIRECT_URL ||
    ""
  ).trim();
}

function getSql(): SqlClient | null {
  const dbUrl = getDbUrl();
  if (!dbUrl) return null;
  if (!cachedSql || cachedDbUrl !== dbUrl) {
    cachedSql = neon(dbUrl);
    cachedDbUrl = dbUrl;
  }
  return cachedSql;
}

interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

function getR2Config(): R2Config | null {
  const accountId = (process.env.R2_ACCOUNT_ID || "").trim();
  const endpoint = (
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "")
  ).trim();
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
  const bucket = (process.env.R2_BUCKET_NAME || "").trim();

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return { endpoint, accessKeyId, secretAccessKey, bucket };
}

function createR2Client(cfg: R2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
}

interface GasConfig {
  url: string;
  secret: string;
  spreadsheetId: string;
}

function getGasConfig(): GasConfig | null {
  const url = (process.env.GOOGLE_APPS_SCRIPT_URL || "").trim();
  const secret = (process.env.GOOGLE_APPS_SCRIPT_SECRET || "").trim();
  const spreadsheetId = (process.env.GOOGLE_SPREADSHEET_ID || "").trim();
  if (!url || !secret) return null;
  return { url, secret, spreadsheetId };
}

function getCanonicalOrigin(): string {
  const configured = (process.env.CANONICAL_APP_URL || "https://e-dam-iare.vercel.app").trim();
  try {
    const parsed = new URL(configured);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.origin;
    }
  } catch {
    // Fallback below
  }
  return "https://e-dam-iare.vercel.app";
}

// ==============================================================================
// 2. CORS, SECURITY HEADERS, CSRF & HTTP UTILITIES
// ==============================================================================

const ALLOWED_LOCAL_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/i;

function isProductionEnv(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>([
    "https://e-dam-iare.vercel.app",
  ]);

  const vercelUrl = (process.env.VERCEL_URL || "").trim();
  if (vercelUrl) {
    origins.add(vercelUrl.startsWith("http") ? new URL(vercelUrl).origin : `https://${vercelUrl}`);
  }

  const branchUrl = (process.env.VERCEL_BRANCH_URL || "").trim();
  if (branchUrl) {
    origins.add(branchUrl.startsWith("http") ? new URL(branchUrl).origin : `https://${branchUrl}`);
  }

  const extra = (process.env.ALLOWED_ORIGINS || "").trim();
  if (extra) {
    for (const candidate of extra.split(",")) {
      const trimmed = candidate.trim();
      if (!trimmed) continue;
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
          origins.add(parsed.origin);
        }
      } catch {
        // Ignore malformed entry
      }
    }
  }

  return origins;
}

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    const normalized = parsed.origin;
    if (getAllowedOrigins().has(normalized)) {
      return true;
    }
    if (!isProductionEnv() && ALLOWED_LOCAL_ORIGIN_REGEX.test(normalized)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function applyCors(
  req: IncomingMessage,
  res: ServerResponse
): { originPresent: boolean; originAllowed: boolean } {
  res.setHeader("Vary", "Origin");
  const rawOrigin = typeof req.headers.origin === "string" ? req.headers.origin.trim() : "";

  if (!rawOrigin) {
    return { originPresent: false, originAllowed: false };
  }

  const allowed = isAllowedOrigin(rawOrigin);
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", new URL(rawOrigin).origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-CSRF-Token"
    );
  }

  return { originPresent: true, originAllowed: allowed };
}

function applySecurityHeaders(res: ServerResponse): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  applySecurityHeaders(res);
  res.end(JSON.stringify(data));
}

function sendErr(res: ServerResponse, status: number, error: string): void {
  sendJson(res, status, { success: false, error, details: null });
}

const MAX_JSON_BODY_BYTES = 512 * 1024; // 512 KB

async function parseBody<T = Record<string, unknown>>(
  req: IncomingMessage
): Promise<{ data: T; ok: boolean; tooLarge?: boolean }> {
  const customReq = req as IncomingMessage & { body?: unknown };
  if (customReq.body !== undefined && customReq.body !== null) {
    if (typeof customReq.body === "string") {
      if (Buffer.byteLength(customReq.body, "utf8") > MAX_JSON_BODY_BYTES) {
        return { data: {} as T, ok: false, tooLarge: true };
      }
      if (!customReq.body.trim()) {
        return { data: {} as T, ok: true };
      }
      try {
        const parsed = JSON.parse(customReq.body);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return { data: {} as T, ok: false };
        }
        return { data: parsed as T, ok: true };
      } catch {
        return { data: {} as T, ok: false };
      }
    }
    if (typeof customReq.body === "object" && !Array.isArray(customReq.body)) {
      return { data: customReq.body as T, ok: true };
    }
    return { data: {} as T, ok: false };
  }

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let settled = false;

    req.on("data", (chunk: Buffer | string) => {
      if (settled) return;
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buf.length;
      if (totalBytes > MAX_JSON_BODY_BYTES) {
        settled = true;
        req.destroy();
        resolve({ data: {} as T, ok: false, tooLarge: true });
        return;
      }
      chunks.push(buf);
    });

    req.on("end", () => {
      if (settled) return;
      settled = true;
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve({ data: {} as T, ok: true });
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          resolve({ data: {} as T, ok: false });
          return;
        }
        resolve({ data: parsed as T, ok: true });
      } catch {
        resolve({ data: {} as T, ok: false });
      }
    });

    req.on("error", () => {
      if (settled) return;
      settled = true;
      resolve({ data: {} as T, ok: false });
    });
  });
}

function parseCookies(req: IncomingMessage): Record<string, string> {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;
  if (rc) {
    for (const cookie of rc.split(";")) {
      const idx = cookie.indexOf("=");
      if (idx === -1) continue;
      const key = cookie.slice(0, idx).trim();
      const rawVal = cookie.slice(idx + 1).trim();
      if (key) {
        try {
          list[key] = decodeURIComponent(rawVal);
        } catch {
          list[key] = rawVal;
        }
      }
    }
  }
  return list;
}

function extractToken(req: IncomingMessage): { token: string | null; viaCookie: boolean } {
  const cookies = parseCookies(req);
  const cookieToken = cookies["edam_admin_session"] || null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) {
      return { token: bearer, viaCookie: Boolean(cookieToken) };
    }
  }
  return { token: cookieToken, viaCookie: Boolean(cookieToken) };
}

function isSecureCookieRequest(req: IncomingMessage): boolean {
  const proto = String(req.headers["x-forwarded-proto"] || "").toLowerCase();
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production" ||
    proto.includes("https")
  );
}

function setAuthCookie(req: IncomingMessage, res: ServerResponse, token: string): void {
  const secureFlag = isSecureCookieRequest(req) ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `edam_admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secureFlag}`
  );
}

function clearAuthCookie(req: IncomingMessage, res: ServerResponse): void {
  const secureFlag = isSecureCookieRequest(req) ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `edam_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`
  );
}

function isValidIpLiteral(candidate: string): boolean {
  return /^[0-9a-fA-F:.]{3,45}$/.test(candidate);
}

function getClientIp(req: IncomingMessage): string {
  if (process.env.VERCEL === "1") {
    const vercelForwarded = req.headers["x-vercel-forwarded-for"];
    if (vercelForwarded) {
      const first = (Array.isArray(vercelForwarded) ? vercelForwarded[0] : vercelForwarded.split(",")[0]).trim();
      if (first && isValidIpLiteral(first)) return first;
    }
    const realIp = req.headers["x-real-ip"];
    if (typeof realIp === "string" && isValidIpLiteral(realIp.trim())) {
      return realIp.trim();
    }
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
      const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0]).trim();
      if (first && isValidIpLiteral(first)) return first;
    }
  }
  const socketIp = (req.socket?.remoteAddress || "").trim();
  return isValidIpLiteral(socketIp) ? socketIp : "127.0.0.1";
}

function validateCsrf(req: IncomingMessage, pathname: string): boolean {
  const method = (req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  // Webhook uses cryptographic HMAC/shared secret header instead of browser session cookies
  if (pathname === "/api/integrations/google/webhook") {
    return true;
  }

  const rawOrigin = typeof req.headers.origin === "string" ? req.headers.origin.trim() : "";
  if (rawOrigin) {
    return isAllowedOrigin(rawOrigin);
  }

  const rawReferer = typeof req.headers.referer === "string" ? req.headers.referer.trim() : "";
  if (rawReferer) {
    try {
      const refOrigin = new URL(rawReferer).origin;
      return isAllowedOrigin(refOrigin);
    } catch {
      return false;
    }
  }

  // No Origin and no Referer: allow non-cookie Bearer requests; reject cookie-authenticated mutations
  const { viaCookie } = extractToken(req);
  const hasBearer = Boolean(req.headers.authorization && req.headers.authorization.startsWith("Bearer "));
  if (hasBearer && !viaCookie) {
    return true;
  }

  if (viaCookie) {
    return false;
  }

  // Pre-auth login without Origin/Referer is only accepted in non-browser CLI contexts when no session cookie exists
  return pathname === "/api/auth/login" && !viaCookie;
}

// ==============================================================================
// 3. DISTRIBUTED RATE LIMITING & AUDIT LOGGING (NEON BACKED)
// ==============================================================================

async function checkRateLimit(
  db: SqlClient,
  rateKey: string,
  maxHits: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  try {
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const windowCutoffIso = new Date(now - windowMs).toISOString();

    const rows = await db`
      INSERT INTO api_rate_limits (rate_key, hit_count, window_start)
      VALUES (${rateKey}, 1, ${nowIso}::timestamptz)
      ON CONFLICT (rate_key) DO UPDATE SET
        hit_count = CASE
          WHEN api_rate_limits.window_start < ${windowCutoffIso}::timestamptz THEN 1
          ELSE api_rate_limits.hit_count + 1
        END,
        window_start = CASE
          WHEN api_rate_limits.window_start < ${windowCutoffIso}::timestamptz THEN ${nowIso}::timestamptz
          ELSE api_rate_limits.window_start
        END
      RETURNING hit_count, window_start;
    `;

    // Periodic lightweight cleanup of expired buckets (~2% of calls)
    if (Math.random() < 0.02) {
      const staleIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      await db`DELETE FROM api_rate_limits WHERE window_start < ${staleIso}::timestamptz;`;
    }

    const hits = Number(rows[0]?.hit_count || 1);
    if (hits > maxHits) {
      const winStartMs = new Date(String(rows[0]?.window_start || nowIso)).getTime();
      const retryAfterSeconds = Math.max(1, Math.ceil((winStartMs + windowMs - now) / 1000));
      return { allowed: false, retryAfterSeconds };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  } catch (err) {
    console.warn("Rate limiter query fallback:", err instanceof Error ? err.message : "error");
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

async function enforceRateLimit(
  db: SqlClient,
  res: ServerResponse,
  rateKey: string,
  maxHits: number,
  windowMs: number,
  message = "Too many requests. Please slow down and try again later."
): Promise<boolean> {
  const result = await checkRateLimit(db, rateKey, maxHits, windowMs);
  if (!result.allowed) {
    res.setHeader("Retry-After", String(result.retryAfterSeconds));
    sendErr(res, 429, message);
    return false;
  }
  return true;
}

async function writeAuditLog(
  db: SqlClient,
  entry: {
    action: string;
    actor: string;
    actorRole?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    ipAddress: string;
    status: "success" | "failure" | "pending";
    details?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await db`
      INSERT INTO audit_logs (action, actor, actor_role, entity_type, entity_id, ip_address, status, details, created_at)
      VALUES (
        ${entry.action},
        ${entry.actor.slice(0, 100)},
        ${entry.actorRole || null},
        ${entry.entityType || null},
        ${entry.entityId ? entry.entityId.slice(0, 100) : null},
        ${entry.ipAddress.slice(0, 100)},
        ${entry.status},
        ${JSON.stringify(entry.details || {})}::jsonb,
        NOW()
      );
    `;
  } catch (err) {
    console.warn("Audit log write skipped:", err instanceof Error ? err.message : "error");
  }
}

// ==============================================================================
// 4. VALIDATION & SANITIZATION HELPERS
// ==============================================================================

const EMAIL_REGEX = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;
const CERT_ID_REGEX = /^[A-Za-z0-9_-]{4,64}$/;
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,148}[a-z0-9]?$/;
const USERNAME_REGEX = /^[a-z0-9._-]{3,50}$/;

function validateHttpUrl(rawUrl: unknown, allowedHosts?: string[]): string | null {
  if (typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 1000) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    if (allowedHosts && allowedHosts.length > 0) {
      const host = parsed.hostname.toLowerCase();
      const matched = allowedHosts.some((h) => host === h || host.endsWith(`.${h}`));
      if (!matched) return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function maskEmail(email: string): string {
  const parts = String(email || "").split("@");
  if (parts.length !== 2 || !parts[1]) return "***";
  const local = parts[0];
  const domain = parts[1];
  const visible = local.length > 2 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible || "*"}***@${domain}`;
}

function maskPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (trimmed.length <= 4) return "****";
  return `${"*".repeat(Math.max(4, trimmed.length - 4))}${trimmed.slice(-4)}`;
}

function stripControlChars(input: string): string {
  let out = "";
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if ((code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127) {
      continue;
    }
    out += input[i];
  }
  return out;
}

function normalizeText(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return stripControlChars(value).trim().slice(0, maxLen);
}

function normalizeStringArray(value: unknown, maxItems = 25, maxLen = 400): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.trim()) {
      out.push(normalizeText(item, maxLen));
      if (out.length >= maxItems) break;
    }
  }
  return out;
}

const MIME_EXTENSIONS: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
};

const VALID_UPLOAD_CATEGORIES = ["banners", "certificates", "media", "documents"] as const;
const VALID_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"] as const;
const VALID_CERT_TYPES = ["participation", "merit", "excellence", "appreciation", "speaker", "coordinator", "winner"];
const VALID_EVENT_STATUSES = ["upcoming", "past", "live", "completed", "cancelled", "postponed", "registration_closed"];

// ==============================================================================
// 5. AUTHENTICATION & RBAC LOGIC
// ==============================================================================

type AdminRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  fullName: string;
}

const SESSION_TOKEN_REGEX = /^sess_[0-9a-f]{64}$/;
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const DUMMY_BCRYPT_HASH = "$2a$12$e80yq9Rz.N3w7z9pB2Z/A.6X9h9Z2B7c5B7C2D9E2F4G6H8I0J2K4";

function normalizeRole(roleString?: string | null): AdminRole {
  if (!roleString) return "VIEWER";
  const r = roleString.toUpperCase().trim();
  if (r === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (r === "ADMIN") return "ADMIN";
  if (r === "EDITOR") return "EDITOR";
  return "VIEWER";
}

async function validateSession(
  db: SqlClient,
  token: string
): Promise<{ valid: boolean; user?: AuthUser; error?: string }> {
  if (!token || !SESSION_TOKEN_REGEX.test(token)) {
    return { valid: false, error: "Invalid session token format" };
  }

  try {
    const rows = await db`
      SELECT s.id, s.token, s.last_activity_at, s.expires_at,
             u.id as user_id, u.username, u.email, u.role, u.full_name, u.is_active
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
      await db`DELETE FROM admin_sessions WHERE token = ${token};`;
      return { valid: false, error: "Account disabled" };
    }

    const nowMs = Date.now();
    if (new Date(String(s.expires_at)).getTime() < nowMs) {
      await db`DELETE FROM admin_sessions WHERE token = ${token};`;
      return { valid: false, error: "Session expired" };
    }

    if (s.last_activity_at) {
      const lastActivityMs = new Date(String(s.last_activity_at)).getTime();
      if (Number.isFinite(lastActivityMs) && nowMs - lastActivityMs > INACTIVITY_TIMEOUT_MS) {
        await db`DELETE FROM admin_sessions WHERE token = ${token};`;
        return { valid: false, error: "Session timed out due to inactivity" };
      }
    }

    await db`UPDATE admin_sessions SET last_activity_at = NOW() WHERE token = ${token};`;

    return {
      valid: true,
      user: {
        id: String(s.user_id),
        username: String(s.username),
        email: String(s.email),
        role: normalizeRole(String(s.role)),
        fullName: String(s.full_name || "e-DAM Officer"),
      },
    };
  } catch (err) {
    console.error("Session validation error:", err instanceof Error ? err.message : "error");
    return { valid: false, error: "Session validation error" };
  }
}

async function requireAuth(
  db: SqlClient,
  req: IncomingMessage,
  res: ServerResponse,
  requiredRole?: AdminRole[]
): Promise<{ authorized: boolean; user?: AuthUser }> {
  const { token } = extractToken(req);
  if (!token) {
    sendErr(res, 401, "Unauthorized: Authentication required.");
    return { authorized: false };
  }

  const session = await validateSession(db, token);
  if (!session.valid || !session.user) {
    clearAuthCookie(req, res);
    sendErr(res, 401, "Unauthorized: Session is invalid or expired.");
    return { authorized: false };
  }

  if (requiredRole && !requiredRole.includes(session.user.role)) {
    await writeAuditLog(db, {
      action: "rbac_access_denied",
      actor: session.user.username,
      actorRole: session.user.role,
      entityType: "api_route",
      entityId: req.url ? req.url.split("?")[0] : undefined,
      ipAddress: getClientIp(req),
      status: "failure",
      details: { requiredRole },
    });
    sendErr(res, 403, "Forbidden: Insufficient permissions for this operation.");
    return { authorized: false };
  }

  return { authorized: true, user: session.user };
}

function timingSafeSecretEqual(incoming: string, expected: string): boolean {
  if (!incoming || !expected) return false;
  const h1 = crypto.createHash("sha256").update(incoming, "utf8").digest();
  const h2 = crypto.createHash("sha256").update(expected, "utf8").digest();
  return crypto.timingSafeEqual(h1, h2);
}

// ==============================================================================
// 6. MAIN DISPATCHER HANDLER
// ==============================================================================

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const cors = applyCors(req, res);

  if (req.method === "OPTIONS") {
    if (cors.originPresent && !cors.originAllowed) {
      return sendErr(res, 403, "Origin not allowed by CORS policy.");
    }
    res.statusCode = 204;
    applySecurityHeaders(res);
    res.end();
    return;
  }

  if (cors.originPresent && !cors.originAllowed) {
    return sendErr(res, 403, "Origin not allowed by CORS policy.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(req.url || "/", "https://localhost");
  } catch {
    return sendErr(res, 400, "Malformed request URL.");
  }

  let pathname = parsedUrl.pathname.replace(/\/+$/, "");
  if (!pathname.startsWith("/api")) {
    pathname = "/api" + (pathname.startsWith("/") ? pathname : "/" + pathname);
  }

  if (!validateCsrf(req, pathname)) {
    return sendErr(res, 403, "Forbidden: CSRF validation failed.");
  }

  const db = getSql();

  try {
    // --------------------------------------------------------------------------
    // HEALTH CHECK: GET /api or /api/health
    // --------------------------------------------------------------------------
    if ((pathname === "/api" || pathname === "/api/health") && req.method === "GET") {
      let dbConnected = false;
      let dbLatency = 0;
      if (db) {
        try {
          const t0 = Date.now();
          await db`SELECT 1;`;
          dbLatency = Date.now() - t0;
          dbConnected = true;
        } catch {
          dbConnected = false;
        }
      }

      let r2Connected = false;
      const r2Cfg = getR2Config();
      if (r2Cfg) {
        try {
          const client = createR2Client(r2Cfg);
          await client.send(new HeadBucketCommand({ Bucket: r2Cfg.bucket }));
          r2Connected = true;
        } catch {
          r2Connected = false;
        }
      }

      const gasCfg = getGasConfig();

      return sendJson(res, 200, {
        status: dbConnected ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        version: "1.1.0",
        services: {
          neonDatabase: { connected: dbConnected, latencyMs: dbLatency },
          cloudflareR2: { configured: Boolean(r2Cfg), connected: r2Connected },
          googleAppsScript: { configured: Boolean(gasCfg) },
        },
      });
    }

    if (!db) {
      return sendErr(res, 503, "Service temporarily unavailable.");
    }

    const ip = getClientIp(req);

    // --------------------------------------------------------------------------
    // AUTH: POST /api/auth/login
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/login" && req.method === "POST") {
      const rateOk = await enforceRateLimit(
        db,
        res,
        `login:ip:${ip}`,
        15,
        15 * 60 * 1000,
        "Too many authentication attempts. Please try again later."
      );
      if (!rateOk) {
        await writeAuditLog(db, {
          action: "admin_login_rate_limited",
          actor: "anonymous",
          ipAddress: ip,
          status: "failure",
        });
        return;
      }

      const parsed = await parseBody<{ username?: unknown; password?: unknown }>(req);
      if (parsed.tooLarge) return sendErr(res, 413, "Request payload too large.");
      if (!parsed.ok) return sendErr(res, 400, "Invalid JSON payload.");

      const ident = typeof parsed.data.username === "string"
        ? parsed.data.username.trim().toLowerCase().slice(0, 255)
        : "";
      const pass = typeof parsed.data.password === "string"
        ? parsed.data.password.trim().slice(0, 256)
        : "";

      if (!ident || !pass) {
        return sendErr(res, 400, "Username and password are required.");
      }

      const identOk = await enforceRateLimit(
        db,
        res,
        `login:ident:${ident}`,
        10,
        15 * 60 * 1000,
        "Too many authentication attempts. Please try again later."
      );
      if (!identOk) {
        await writeAuditLog(db, {
          action: "admin_login_rate_limited",
          actor: ident,
          ipAddress: ip,
          status: "failure",
        });
        return;
      }

      const users = await db`
        SELECT id, username, email, password_hash, role, full_name, is_active,
               failed_login_attempts, locked_until
        FROM admin_users
        WHERE LOWER(username) = ${ident} OR LOWER(email) = ${ident}
        LIMIT 1;
      `;

      const user = users[0];
      const passwordHash = user ? String(user.password_hash) : DUMMY_BCRYPT_HASH;
      const isPasswordValid = await bcrypt.compare(pass, passwordHash);
      const isLocked = Boolean(
        user?.locked_until && new Date(String(user.locked_until)).getTime() > Date.now()
      );

      if (!user || !isPasswordValid || !user.is_active || isLocked) {
        await db`
          INSERT INTO login_attempts (identifier, ip_address, success, attempted_at)
          VALUES (${ident}, ${ip}, false, NOW());
        `;

        const currentFailures = Number(user?.failed_login_attempts || 0);
        if (user && !isLocked) {
          const nextAttempts = currentFailures + 1;
          const lockUntil =
            nextAttempts >= MAX_FAILED_ATTEMPTS
              ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
              : null;

          await db`
            UPDATE admin_users
            SET failed_login_attempts = ${nextAttempts},
                locked_until = ${lockUntil}::timestamptz,
                updated_at = NOW()
            WHERE id = ${user.id};
          `;
        }

        const reason = isLocked
          ? "account_locked"
          : !user
          ? "unknown_user"
          : !user.is_active
          ? "inactive_user"
          : "invalid_password";

        await writeAuditLog(db, {
          action: "admin_login_failure",
          actor: ident,
          ipAddress: ip,
          status: "failure",
          details: { reason },
        });

        // Progressive delay on failed attempt (bounded to 1.2s to avoid gateway timeout)
        const delayMs = Math.min((currentFailures + 1) * 200, 1200);
        await new Promise((r) => setTimeout(r, delayMs));

        return sendErr(res, 401, "Invalid username or password.");
      }

      // Rotate out any previous session token supplied with request + prune stale sessions
      const prev = extractToken(req);
      if (prev.token && SESSION_TOKEN_REGEX.test(prev.token)) {
        await db`DELETE FROM admin_sessions WHERE token = ${prev.token};`;
      }
      await db`DELETE FROM admin_sessions WHERE user_id = ${user.id} AND expires_at < NOW();`;

      const normalizedRole = normalizeRole(String(user.role));
      const token = `sess_${crypto.randomBytes(32).toString("hex")}`;
      const sessionId = `sess_${crypto.randomUUID()}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const userAgent =
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"].slice(0, 255)
          : "";

      await db`
        INSERT INTO login_attempts (identifier, ip_address, success, attempted_at)
        VALUES (${ident}, ${ip}, true, NOW());
      `;

      await db`
        INSERT INTO admin_sessions (
          id, user_id, token, ip_address, user_agent, expires_at, created_at, last_activity_at
        ) VALUES (
          ${sessionId}, ${user.id}, ${token}, ${ip}, ${userAgent},
          ${expiresAt}::timestamptz, NOW(), NOW()
        );
      `;

      await db`
        UPDATE admin_users
        SET failed_login_attempts = 0,
            locked_until = NULL,
            last_login_at = NOW(),
            last_login_ip = ${ip},
            updated_at = NOW()
        WHERE id = ${user.id};
      `;

      await writeAuditLog(db, {
        action: "admin_login_success",
        actor: String(user.username),
        actorRole: normalizedRole,
        entityType: "admin_sessions",
        entityId: sessionId,
        ipAddress: ip,
        status: "success",
      });

      setAuthCookie(req, res, token);

      return sendJson(res, 200, {
        success: true,
        message: "Authentication successful",
        user: {
          id: String(user.id),
          username: String(user.username),
          email: String(user.email),
          role: normalizedRole,
          fullName: String(user.full_name || "e-DAM Officer"),
        },
      });
    }

    // --------------------------------------------------------------------------
    // AUTH: POST /api/auth/logout
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/logout" && req.method === "POST") {
      const { token } = extractToken(req);
      if (token && SESSION_TOKEN_REGEX.test(token)) {
        const deleted = await db`
          DELETE FROM admin_sessions
          WHERE token = ${token}
          RETURNING user_id;
        `;
        if (deleted.length > 0) {
          await writeAuditLog(db, {
            action: "admin_logout",
            actor: String(deleted[0].user_id),
            entityType: "admin_sessions",
            ipAddress: ip,
            status: "success",
          });
        }
      }
      clearAuthCookie(req, res);
      return sendJson(res, 200, { success: true, message: "Logged out successfully" });
    }

    // --------------------------------------------------------------------------
    // AUTH: GET /api/auth/me (Fail-Closed: returns 401 when unauthenticated)
    // --------------------------------------------------------------------------
    if (pathname === "/api/auth/me" && req.method === "GET") {
      const { token } = extractToken(req);
      if (!token) {
        return sendJson(res, 401, {
          success: false,
          authenticated: false,
          user: null,
          error: "Authentication required.",
        });
      }
      const session = await validateSession(db, token);
      if (!session.valid || !session.user) {
        clearAuthCookie(req, res);
        return sendJson(res, 401, {
          success: false,
          authenticated: false,
          user: null,
          error: "Session is invalid or expired.",
        });
      }
      return sendJson(res, 200, {
        success: true,
        authenticated: true,
        user: session.user,
      });
    }

    // --------------------------------------------------------------------------
    // EVENTS: GET (Public, safe column projection) & POST (SUPER_ADMIN / ADMIN)
    // --------------------------------------------------------------------------
    if (pathname === "/api/events") {
      if (req.method === "GET") {
        const statusParam = parsedUrl.searchParams.get("status");
        const categoryParam = parsedUrl.searchParams.get("category");
        const statusFilter =
          statusParam && VALID_EVENT_STATUSES.includes(statusParam.toLowerCase())
            ? statusParam.toLowerCase()
            : null;
        const categoryFilter =
          categoryParam && categoryParam.trim() ? normalizeText(categoryParam, 50) : null;

        let events;
        if (statusFilter && categoryFilter) {
          events = await db`
            SELECT id, slug, title, tagline, category, status, date, time, venue, mode,
                   description, detailed_overview, prerequisites, takeaways, speakers,
                   registration_deadline, registration_open, registration_url,
                   google_form_id, google_form_url, form_status, response_count,
                   banner_image, capacity, featured, created_at, updated_at
            FROM chapter_events
            WHERE is_archived = false AND status = ${statusFilter} AND category = ${categoryFilter}
            ORDER BY date ASC, created_at DESC;
          `;
        } else if (statusFilter) {
          events = await db`
            SELECT id, slug, title, tagline, category, status, date, time, venue, mode,
                   description, detailed_overview, prerequisites, takeaways, speakers,
                   registration_deadline, registration_open, registration_url,
                   google_form_id, google_form_url, form_status, response_count,
                   banner_image, capacity, featured, created_at, updated_at
            FROM chapter_events
            WHERE is_archived = false AND status = ${statusFilter}
            ORDER BY date ASC, created_at DESC;
          `;
        } else if (categoryFilter) {
          events = await db`
            SELECT id, slug, title, tagline, category, status, date, time, venue, mode,
                   description, detailed_overview, prerequisites, takeaways, speakers,
                   registration_deadline, registration_open, registration_url,
                   google_form_id, google_form_url, form_status, response_count,
                   banner_image, capacity, featured, created_at, updated_at
            FROM chapter_events
            WHERE is_archived = false AND category = ${categoryFilter}
            ORDER BY date ASC, created_at DESC;
          `;
        } else {
          events = await db`
            SELECT id, slug, title, tagline, category, status, date, time, venue, mode,
                   description, detailed_overview, prerequisites, takeaways, speakers,
                   registration_deadline, registration_open, registration_url,
                   google_form_id, google_form_url, form_status, response_count,
                   banner_image, capacity, featured, created_at, updated_at
            FROM chapter_events
            WHERE is_archived = false
            ORDER BY date ASC, created_at DESC;
          `;
        }

        return sendJson(res, 200, { success: true, count: events.length, events });
      }

      if (req.method === "POST") {
        const auth = await requireAuth(db, req, res, ["SUPER_ADMIN", "ADMIN"]);
        if (!auth.authorized || !auth.user) return;

        const rateOk = await enforceRateLimit(
          db,
          res,
          `admin_mutation:user:${auth.user.id}`,
          40,
          5 * 60 * 1000
        );
        if (!rateOk) return;

        const parsed = await parseBody<Record<string, unknown>>(req);
        if (parsed.tooLarge) return sendErr(res, 413, "Request payload too large.");
        if (!parsed.ok) return sendErr(res, 400, "Invalid JSON payload.");
        const body = parsed.data;

        const title = normalizeText(body.title, 200);
        if (!title) return sendErr(res, 400, "Event title is required.");

        const rawSlug = normalizeText(body.slug, 150).toLowerCase() ||
          title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (!rawSlug || !SLUG_REGEX.test(rawSlug)) {
          return sendErr(res, 400, "Event slug must contain lowercase letters, numbers, and hyphens only.");
        }

        const googleFormUrl = body.googleFormUrl
          ? validateHttpUrl(body.googleFormUrl)
          : "";
        if (body.googleFormUrl && googleFormUrl === null) {
          return sendErr(res, 400, "Google Form URL must use a valid http:// or https:// address.");
        }

        const registrationUrl = body.registrationUrl
          ? validateHttpUrl(body.registrationUrl)
          : googleFormUrl || "";
        if (body.registrationUrl && registrationUrl === null) {
          return sendErr(res, 400, "Registration URL must use a valid http:// or https:// address.");
        }

        const bannerImage = body.bannerImage
          ? validateHttpUrl(body.bannerImage)
          : "";
        if (body.bannerImage && bannerImage === null) {
          return sendErr(res, 400, "Banner image URL must use a valid http:// or https:// address.");
        }

        const statusRaw = normalizeText(body.status, 40).toLowerCase() || "upcoming";
        if (!VALID_EVENT_STATUSES.includes(statusRaw)) {
          return sendErr(res, 400, "Invalid event status.");
        }

        const modeRaw = normalizeText(body.mode, 30).toLowerCase() || "offline";
        const mode = modeRaw === "virtual" || modeRaw === "online"
          ? "online"
          : modeRaw === "hybrid"
          ? "hybrid"
          : "offline";

        const capacityNum = Number(body.capacity ?? 100);
        if (!Number.isInteger(capacityNum) || capacityNum < 1 || capacityNum > 10000) {
          return sendErr(res, 400, "Capacity must be an integer between 1 and 10000.");
        }

        const rawId = normalizeText(body.id, 100);
        const id = rawId && /^[a-zA-Z0-9_-]{3,100}$/.test(rawId)
          ? rawId
          : `evt_${crypto.randomUUID().slice(0, 18)}`;

        const existingBySlug = await db`
          SELECT id FROM chapter_events WHERE slug = ${rawSlug} AND id <> ${id} LIMIT 1;
        `;
        if (existingBySlug.length > 0) {
          return sendErr(res, 409, "An event with this slug already exists.");
        }

        await db`
          INSERT INTO chapter_events (
            id, slug, title, tagline, category, status, date, time, venue, mode,
            description, detailed_overview, prerequisites, takeaways, speakers,
            registration_deadline, registration_open, registration_url, google_form_id,
            google_form_url, google_form_edit_url, form_status, banner_image, capacity, featured,
            is_archived, created_at, updated_at
          ) VALUES (
            ${id},
            ${rawSlug},
            ${title},
            ${normalizeText(body.tagline, 400)},
            ${normalizeText(body.category, 50) || "Workshop"},
            ${statusRaw},
            ${normalizeText(body.date, 50) || "TBA"},
            ${normalizeText(body.time, 100) || "10:00 AM"},
            ${normalizeText(body.venue, 300) || "IARE Campus"},
            ${mode},
            ${normalizeText(body.description, 5000)},
            ${JSON.stringify(normalizeStringArray(body.detailedOverview))}::jsonb,
            ${JSON.stringify(normalizeStringArray(body.prerequisites))}::jsonb,
            ${JSON.stringify(normalizeStringArray(body.takeaways))}::jsonb,
            ${JSON.stringify(Array.isArray(body.speakers) ? body.speakers.slice(0, 10) : [])}::jsonb,
            ${normalizeText(body.registrationDeadline, 50)},
            ${body.registrationOpen !== false},
            ${registrationUrl || ""},
            ${normalizeText(body.googleFormId, 150)},
            ${googleFormUrl || ""},
            '',
            ${normalizeText(body.formStatus, 50) || "active"},
            ${bannerImage || null},
            ${capacityNum},
            ${Boolean(body.featured)},
            false, NOW(), NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            slug = EXCLUDED.slug,
            tagline = EXCLUDED.tagline,
            category = EXCLUDED.category,
            status = EXCLUDED.status,
            date = EXCLUDED.date,
            time = EXCLUDED.time,
            venue = EXCLUDED.venue,
            mode = EXCLUDED.mode,
            description = EXCLUDED.description,
            registration_open = EXCLUDED.registration_open,
            google_form_url = EXCLUDED.google_form_url,
            registration_url = EXCLUDED.registration_url,
            capacity = EXCLUDED.capacity,
            updated_at = NOW();
        `;

        await writeAuditLog(db, {
          action: "event_created",
          actor: auth.user.username,
          actorRole: auth.user.role,
          entityType: "chapter_events",
          entityId: id,
          ipAddress: ip,
          status: "success",
          details: { slug: rawSlug, title },
        });

        return sendJson(res, 201, { success: true, message: "Event saved", eventId: id, slug: rawSlug });
      }
    }

    // --------------------------------------------------------------------------
    // EVENTS BY SLUG: GET (Public), PUT (SUPER_ADMIN/ADMIN/EDITOR), DELETE (SUPER_ADMIN/ADMIN)
    // --------------------------------------------------------------------------
    if (pathname.startsWith("/api/events/")) {
      let slugOrId = "";
      try {
        slugOrId = decodeURIComponent(pathname.replace("/api/events/", "")).trim();
      } catch {
        return sendErr(res, 400, "Invalid event identifier.");
      }
      if (!slugOrId || slugOrId.length > 200) {
        return sendErr(res, 400, "Invalid event identifier.");
      }

      if (req.method === "GET") {
        const rows = await db`
          SELECT id, slug, title, tagline, category, status, date, time, venue, mode,
                 description, detailed_overview, prerequisites, takeaways, speakers,
                 registration_deadline, registration_open, registration_url,
                 google_form_id, google_form_url, form_status, response_count,
                 banner_image, capacity, featured, created_at, updated_at
          FROM chapter_events
          WHERE (slug = ${slugOrId} OR id = ${slugOrId}) AND is_archived = false
          LIMIT 1;
        `;
        if (rows.length === 0) return sendErr(res, 404, "Event not found.");
        return sendJson(res, 200, { success: true, event: rows[0] });
      }

      if (req.method === "PUT") {
        const auth = await requireAuth(db, req, res, ["SUPER_ADMIN", "ADMIN", "EDITOR"]);
        if (!auth.authorized || !auth.user) return;

        const rateOk = await enforceRateLimit(
          db,
          res,
          `admin_mutation:user:${auth.user.id}`,
          40,
          5 * 60 * 1000
        );
        if (!rateOk) return;

        const parsed = await parseBody<Record<string, unknown>>(req);
        if (parsed.tooLarge) return sendErr(res, 413, "Request payload too large.");
        if (!parsed.ok) return sendErr(res, 400, "Invalid JSON payload.");
        const body = parsed.data;

        const title = body.title !== undefined ? normalizeText(body.title, 200) : null;
        if (body.title !== undefined && !title) {
          return sendErr(res, 400, "Event title cannot be empty.");
        }

        let googleFormUrl: string | null = null;
        if (body.googleFormUrl !== undefined) {
          if (typeof body.googleFormUrl === "string" && body.googleFormUrl.trim() === "") {
            googleFormUrl = "";
          } else {
            googleFormUrl = validateHttpUrl(body.googleFormUrl);
            if (googleFormUrl === null) {
              return sendErr(res, 400, "Google Form URL must use a valid http:// or https:// address.");
            }
          }
        }

        let modeValue: string | null = null;
        if (body.mode !== undefined) {
          const m = normalizeText(body.mode, 30).toLowerCase();
          modeValue = m === "virtual" || m === "online" ? "online" : m === "hybrid" ? "hybrid" : "offline";
        }

        let statusValue: string | null = null;
        if (body.status !== undefined) {
          const st = normalizeText(body.status, 40).toLowerCase();
          if (!VALID_EVENT_STATUSES.includes(st)) {
            return sendErr(res, 400, "Invalid event status.");
          }
          statusValue = st;
        }

        const updated = await db`
          UPDATE chapter_events SET
            title = COALESCE(${title}, title),
            tagline = COALESCE(${body.tagline !== undefined ? normalizeText(body.tagline, 400) : null}, tagline),
            category = COALESCE(${body.category !== undefined ? normalizeText(body.category, 50) : null}, category),
            status = COALESCE(${statusValue}, status),
            date = COALESCE(${body.date !== undefined ? normalizeText(body.date, 50) : null}, date),
            time = COALESCE(${body.time !== undefined ? normalizeText(body.time, 100) : null}, time),
            venue = COALESCE(${body.venue !== undefined ? normalizeText(body.venue, 300) : null}, venue),
            mode = COALESCE(${modeValue}, mode),
            description = COALESCE(${body.description !== undefined ? normalizeText(body.description, 5000) : null}, description),
            google_form_url = COALESCE(${googleFormUrl}, google_form_url),
            registration_url = COALESCE(${googleFormUrl}, registration_url),
            registration_open = COALESCE(${typeof body.registrationOpen === "boolean" ? body.registrationOpen : null}, registration_open),
            updated_at = NOW()
          WHERE (slug = ${slugOrId} OR id = ${slugOrId}) AND is_archived = false
          RETURNING id, slug;
        `;

        if (updated.length === 0) {
          return sendErr(res, 404, "Event not found.");
        }

        await writeAuditLog(db, {
          action: "event_updated",
          actor: auth.user.username,
          actorRole: auth.user.role,
          entityType: "chapter_events",
          entityId: String(updated[0].id),
          ipAddress: ip,
          status: "success",
        });

        return sendJson(res, 200, { success: true, message: "Event updated" });
      }

      if (req.method === "DELETE") {
        const auth = await requireAuth(db, req, res, ["SUPER_ADMIN", "ADMIN"]);
        if (!auth.authorized || !auth.user) return;

        const rateOk = await enforceRateLimit(
          db,
          res,
          `admin_mutation:user:${auth.user.id}`,
          40,
          5 * 60 * 1000
        );
        if (!rateOk) return;

        const archived = await db`
          UPDATE chapter_events SET is_archived = true, updated_at = NOW()
          WHERE (slug = ${slugOrId} OR id = ${slugOrId}) AND is_archived = false
          RETURNING id;
        `;

        if (archived.length === 0) {
          return sendErr(res, 404, "Event not found.");
        }

        await writeAuditLog(db, {
          action: "event_archived",
          actor: auth.user.username,
          actorRole: auth.user.role,
          entityType: "chapter_events",
          entityId: String(archived[0].id),
          ipAddress: ip,
          status: "success",
        });

        return sendJson(res, 200, { success: true, message: "Event archived" });
      }
    }

    // --------------------------------------------------------------------------
    // REGISTRATIONS: GET (SUPER_ADMIN/ADMIN/VIEWER masked) & POST (SUPER_ADMIN/ADMIN)
    // --------------------------------------------------------------------------
    if (pathname === "/api/registrations") {
      if (req.method === "GET") {
        const auth = await requireAuth(db, req, res, ["SUPER_ADMIN", "ADMIN", "VIEWER"]);
        if (!auth.authorized || !auth.user) return;

        const rateOk = await enforceRateLimit(
          db,
          res,
          `admin_export:user:${auth.user.id}`,
          60,
          5 * 60 * 1000
        );
        if (!rateOk) return;

        const eventId = parsedUrl.searchParams.get("eventId")?.trim() || "";
        const rawLimit = Number(parsedUrl.searchParams.get("limit") || 200);
        const rawOffset = Number(parsedUrl.searchParams.get("offset") || 0);
        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 500) : 200;
        const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0;

        let registrations;
        if (eventId) {
          registrations = await db`
            SELECT id, event_id, event_title, full_name, email, roll_number, department,
                   year_of_study, phone, answers, sync_source, submitted_at
            FROM event_registrations
            WHERE event_id = ${eventId}
            ORDER BY submitted_at DESC
            LIMIT ${limit} OFFSET ${offset};
          `;
        } else {
          registrations = await db`
            SELECT id, event_id, event_title, full_name, email, roll_number, department,
                   year_of_study, phone, answers, sync_source, submitted_at
            FROM event_registrations
            ORDER BY submitted_at DESC
            LIMIT ${limit} OFFSET ${offset};
          `;
        }

        const isViewer = auth.user.role === "VIEWER";
        const sanitized = registrations.map((r) =>
          isViewer
            ? {
                ...r,
                email: maskEmail(String(r.email || "")),
                phone: maskPhone(r.phone ? String(r.phone) : null),
                answers: {},
              }
            : r
        );

        return sendJson(res, 200, {
          success: true,
          count: sanitized.length,
          registrations: sanitized,
        });
      }

      if (req.method === "POST") {
        const auth = await requireAuth(db, req, res, ["SUPER_ADMIN", "ADMIN"]);
        if (!auth.authorized || !auth.user) return;

        const rateOk = await enforceRateLimit(
          db,
          res,
          `admin_mutation:user:${auth.user.id}`,
          40,
          5 * 60 * 1000
        );
        if (!rateOk) return;

        const parsed = await parseBody<Record<string, unknown>>(req);
        if (parsed.tooLarge) return sendErr(res, 413, "Request payload too large.");
        if (!parsed.ok) return sendErr(res, 400, "Invalid JSON payload.");
        const body = parsed.data;

        const fullName = normalizeText(body.fullName, 160);
        const cleanEmail = normalizeText(body.email, 255).toLowerCase();
        const eventId = normalizeText(body.eventId, 100);

        if (!fullName || !cleanEmail || !eventId) {
          return sendErr(res, 400, "Full name, email, and event ID are required.");
        }
        if (!EMAIL_REGEX.test(cleanEmail)) {
          return sendErr(res, 400, "Invalid email address format.");
        }

        const existingEvent = await db`
          SELECT id, title FROM chapter_events
          WHERE id = ${eventId} AND is_archived = false
          LIMIT 1;
        `;
        if (existingEvent.length === 0) {
          return sendErr(res, 404, "Target event not found.");
        }

        const id = `reg_${crypto.randomUUID().slice(0, 18)}`;
        const resolvedEventTitle =
          normalizeText(body.eventTitle, 200) || String(existingEvent[0].title);

        await db`
          INSERT INTO event_registrations (
            id, event_id, event_title, full_name, email, roll_number,
            department, year_of_study, phone, answers, sync_source, submitted_at
          ) VALUES (
            ${id},
            ${eventId},
            ${resolvedEventTitle},
            ${fullName},
            ${cleanEmail},
            ${normalizeText(body.rollNumber, 50).toUpperCase()},
            ${normalizeText(body.department, 100)},
            ${normalizeText(body.yearOfStudy, 50)},
            ${normalizeText(body.phone, 40)},
            ${JSON.stringify(
              body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
                ? body.answers
                : {}
            )}::jsonb,
            'direct_admin',
            NOW()
          );
        `;

        await db`
          UPDATE chapter_events SET response_count = response_count + 1, updated_at = NOW()
          WHERE id = ${eventId};
        `;

        await writeAuditLog(db, {
          action: "registration_created",
          actor: auth.user.username,
          actorRole: auth.user.role,
          entityType: "event_registrations",
          entityId: id,
          ipAddress: ip,
          status: "success",
          details: { eventId },
        });

        return sendJson(res, 201, { success: true, registrationId: id });
      }
    }

    // --------------------------------------------------------------------------
    // CERTIFICATES: GET (SUPER_ADMIN/ADMIN/VIEWER), POST & PUT (SUPER_ADMIN/ADMIN)
    // --------------------------------------------------------------------------
    if (pathname === "/api/certificates") {
      if (req.method === "GET") {
        const auth = await requireAuth(db, req, res, ["SUPER_ADMIN", "ADMIN", "VIEWER"]);
        if (!auth.authorized || !auth.user) return;

        const rateOk = await enforceRateLimit(
          db,
          res,
          `admin_export:user:${auth.user.id}`,
          60,
          5 * 60 * 1000
        );
        if (!rateOk) return;

        const eventId = parsedUrl.searchParams.get("eventId")?.trim() || "";
        const rawLimit = Number(parsedUrl.searchParams.get("limit") || 200);
        const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 500) : 200;

        let certificates;
        if (eventId) {
          certificates = await db`
            SELECT id, certificate_number, event_id, registration_id, template_id,
                   recipient_name, recipient_email, recipient_roll_number, recipient_department,
                   event_title, event_date, certificate_type, status, revoked_at, revoked_reason,
                   pdf_storage_key, qr_verification_url, issued_at, issued_by
            FROM issued_certificates
            WHERE event_id = ${eventId}
            ORDER BY issued_at DESC
            LIMIT ${limit};
          `;
        } else {
          certificates = await db`
            SELECT id, certificate_number, event_id, registration_id, template_id,
                   recipient_name, recipient_email, recipient_roll_number, recipient_department,
                   event_title, event_date, certificate_type, status, revoked_at, revoked_reason,
                   pdf_storage_key, qr_verification_url, issued_at, issued_by
            FROM issued_certificates
            ORDER BY issued_at DESC
            LIMIT ${limit};
          `;
        }

        const isViewer = auth.user.role === "VIEWER";
        const sanitized = certificates.map((c) =>
          isViewer ? { ...c, recipient_email: maskEmail(String(c.recipient_email || "")) } : c
        );

        return sendJson(res, 200, { success: true, count: sanitized.length, certificates: sanitized });
      }

      if (req.method === "POST") {
        const auth = await requireAuth(db, req, res, ["SUPER_ADMIN", "ADMIN"]);
        if (!auth.authorized || !auth.user) return;

        const rateOk = await enforceRateLimit(
          db,
          res,
          `admin_mutation:user:${auth.user.id}`,
          40,
          5 * 60 * 1000
        );
        if (!rateOk) return;

        const parsed = await parseBody<Record<string, unknown>>(req);
        if (parsed.tooLarge) return sendErr(res, 413, "Request payload too large.");
        if (!parsed.ok) return sendErr(res, 400, "Invalid JSON payload.");
        const body = parsed.data;

        const recipientName = normalizeText(body.recipientName, 160);
        const recipientEmail = normalizeText(body.recipientEmail, 255).toLowerCase();
        const eventTitle = normalizeText(body.eventTitle, 250);

        if (!recipientName || !recipientEmail || !eventTitle) {
          return sendErr(res, 400, "Recipient name, email, and event title are required.");
        }
        if (!EMAIL_REGEX.test(recipientEmail)) {
          return sendErr(res, 400, "Invalid recipient email address.");
        }

        const certType = normalizeText(body.certificateType, 50).toLowerCase() || "participation";
        if (!VALID_CERT_TYPES.includes(certType)) {
          return sendErr(res, 400, "Invalid certificate type.");
        }

        const customCertNum = normalizeText(body.certificateNumber, 64).toUpperCase();
        const certNum =
          customCertNum && CERT_ID_REGEX.test(customCertNum)
            ? customCertNum
            : `EDAM-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

        const rawKey = normalizeText(body.pdfStorageKey, 300);
        if (rawKey && (!/^certificates\/[a-zA-Z0-9._/-]+$/.test(rawKey) || rawKey.includes(".."))) {
          return sendErr(res, 400, "Invalid certificate storage key format.");
        }
        const storageKey = rawKey || `certificates/${new Date().getFullYear()}/${certNum}.pdf`;

        const id = `cert_${crypto.randomUUID().slice(0, 18)}`;
        const qrUrl = `${getCanonicalOrigin()}/verify/${encodeURIComponent(certNum)}`;
        const rawEventId = normalizeText(body.eventId, 100);
        const rawRegistrationId = normalizeText(body.registrationId, 100);

        let validEventId: string | null = null;
        if (rawEventId) {
          const evtMatch = await db`
            SELECT id FROM chapter_events WHERE id = ${rawEventId} LIMIT 1;
          `;
          validEventId = evtMatch.length > 0 ? String(evtMatch[0].id) : null;
        }

        let validRegistrationId: string | null = null;
        if (rawRegistrationId) {
          const regMatch = await db`
            SELECT id FROM event_registrations WHERE id = ${rawRegistrationId} LIMIT 1;
          `;
          validRegistrationId = regMatch.length > 0 ? String(regMatch[0].id) : null;
        }

        await db`
          INSERT INTO issued_certificates (
            id, certificate_number, event_id, registration_id, template_id,
            recipient_name, recipient_email, recipient_roll_number, recipient_department,
            event_title, event_date, certificate_type, status, pdf_storage_key,
            pdf_file_size, qr_verification_url, issued_at, issued_by
          ) VALUES (
            ${id},
            ${certNum},
            ${validEventId},
            ${validRegistrationId},
            ${normalizeText(body.templateId, 100) || "tmpl_edam_participation"},
            ${recipientName},
            ${recipientEmail},
            ${normalizeText(body.recipientRollNumber, 50).toUpperCase()},
            ${normalizeText(body.recipientDepartment, 120)},
            ${eventTitle},
            ${normalizeText(body.eventDate, 50) || "Nov 2026"},
            ${certType},
            'valid',
            ${storageKey},
            ${Math.max(0, Number(body.pdfFileSize || 0))},
            ${qrUrl},
            NOW(),
            ${auth.user.username}
          );
        `;

        await writeAuditLog(db, {
          action: "certificate_issued",
          actor: auth.user.username,
          actorRole: auth.user.role,
          entityType: "issued_certificates",
          entityId: certNum,
          ipAddress: ip,
          status: "success",
          details: { eventTitle, certificateType: certType },
        });

        return sendJson(res, 201, {
          success: true,
          certificateNumber: certNum,
          qrVerificationUrl: qrUrl,
          storageKey,
        });
      }

      if (req.method === "PUT") {
        const auth = await requireAuth(db, req, res, ["SUPER_ADMIN", "ADMIN"]);
        if (!auth.authorized || !auth.user) return;

        const rateOk = await enforceRateLimit(
          db,
          res,
          `admin_mutation:user:${auth.user.id}`,
          40,
          5 * 60 * 1000
        );
        if (!rateOk) return;

        const parsed = await parseBody<{
          certificateNumber?: unknown;
          status?: unknown;
          revokedReason?: unknown;
        }>(req);
        if (parsed.tooLarge) return sendErr(res, 413, "Request payload too large.");
        if (!parsed.ok) return sendErr(res, 400, "Invalid JSON payload.");

        const certNum = normalizeText(parsed.data.certificateNumber, 64);
        const nextStatus = normalizeText(parsed.data.status, 20).toLowerCase();
        const reason = normalizeText(parsed.data.revokedReason, 300);

        if (!certNum || !CERT_ID_REGEX.test(certNum)) {
          return sendErr(res, 400, "Valid certificateNumber is required.");
        }
        if (nextStatus !== "valid" && nextStatus !== "revoked") {
          return sendErr(res, 400, "Status must be either 'valid' or 'revoked'.");
        }

        const updated = await db`
          UPDATE issued_certificates
          SET status = ${nextStatus},
              revoked_at = ${nextStatus === "revoked" ? new Date().toISOString() : null}::timestamptz,
              revoked_reason = ${nextStatus === "revoked" ? (reason || "Administrative revocation") : null}
          WHERE certificate_number = ${certNum} OR id = ${certNum}
          RETURNING certificate_number, status;
        `;

        if (updated.length === 0) {
          return sendErr(res, 404, "Certificate not found.");
        }

        await writeAuditLog(db, {
          action: "certificate_status_updated",
          actor: auth.user.username,
          actorRole: auth.user.role,
          entityType: "issued_certificates",
          entityId: String(updated[0].certificate_number),
          ipAddress: ip,
          status: "success",
          details: { status: nextStatus },
        });

        return sendJson(res, 200, {
          success: true,
          certificateNumber: updated[0].certificate_number,
          status: updated[0].status,
        });
      }
    }

    // --------------------------------------------------------------------------
    // CERTIFICATES VERIFY: GET /api/certificates/verify/:id (Public, Rate Limited)
    // --------------------------------------------------------------------------
    if (pathname.startsWith("/api/certificates/verify/") && req.method === "GET") {
      const rateOk = await enforceRateLimit(
        db,
        res,
        `cert_verify:ip:${ip}`,
        30,
        5 * 60 * 1000,
        "Too many verification requests. Please try again in a few minutes."
      );
      if (!rateOk) return;

      let certNumber = "";
      try {
        certNumber = decodeURIComponent(
          pathname.replace("/api/certificates/verify/", "")
        ).trim();
      } catch {
        return sendErr(res, 400, "Invalid certificate identifier.");
      }

      if (!CERT_ID_REGEX.test(certNumber)) {
        return sendErr(res, 400, "Invalid certificate identifier format.");
      }

      const rows = await db`
        SELECT c.id, c.certificate_number, c.recipient_name, c.recipient_email,
               c.recipient_roll_number, c.recipient_department, c.event_title,
               c.event_date, c.certificate_type, c.status, c.revoked_reason,
               c.pdf_storage_key, c.issued_at, t.issuer_organization
        FROM issued_certificates c
        LEFT JOIN certificate_templates t ON c.template_id = t.id
        WHERE UPPER(c.certificate_number) = UPPER(${certNumber}) OR c.id = ${certNumber}
        LIMIT 1;
      `;

      if (rows.length === 0) {
        return sendErr(res, 404, "Certificate not found or invalid.");
      }

      const cert = rows[0];
      const isValid = cert.status === "valid";
      const storageKey = String(cert.pdf_storage_key || "");

      let downloadUrl: string | null = null;
      const r2Cfg = getR2Config();
      if (
        isValid &&
        r2Cfg &&
        /^certificates\/[a-zA-Z0-9._/-]+$/.test(storageKey) &&
        !storageKey.includes("..")
      ) {
        try {
          const client = createR2Client(r2Cfg);
          downloadUrl = await getSignedUrl(
            client,
            new GetObjectCommand({ Bucket: r2Cfg.bucket, Key: storageKey }),
            { expiresIn: 300 }
          );
        } catch {
          downloadUrl = null;
        }
      }

      return sendJson(res, 200, {
        success: true,
        valid: isValid,
        certificate: {
          certificateNumber: cert.certificate_number,
          recipientName: cert.recipient_name,
          recipientEmail: maskEmail(String(cert.recipient_email || "")),
          rollNumber: cert.recipient_roll_number,
          department: cert.recipient_department,
          eventTitle: cert.event_title,
          eventDate: cert.event_date,
          type: cert.certificate_type,
          status: cert.status,
          revokedReason: isValid ? undefined : cert.revoked_reason,
          issuerOrganization: cert.issuer_organization || "e-DAM Student Chapter, IARE",
          issuedAt: cert.issued_at,
          downloadUrl,
        },
      });
    }

    // --------------------------------------------------------------------------
    // R2 PRESIGNED UPLOADS: POST /api/uploads/presigned-url (SUPER_ADMIN/ADMIN/EDITOR)
    // --------------------------------------------------------------------------
    if (pathname === "/api/uploads/presigned-url" && req.method === "POST") {
      const auth = await requireAuth(db, req, res, ["SUPER_ADMIN", "ADMIN", "EDITOR"]);
      if (!auth.authorized || !auth.user) return;

      const rateOk = await enforceRateLimit(
        db,
        res,
        `uploads:user:${auth.user.id}`,
        20,
        15 * 60 * 1000
      );
      if (!rateOk) return;

      const parsed = await parseBody<{
        category?: unknown;
        filename?: unknown;
        contentType?: unknown;
        fileSizeBytes?: unknown;
      }>(req);
      if (parsed.tooLarge) return sendErr(res, 413, "Request payload too large.");
      if (!parsed.ok) return sendErr(res, 400, "Invalid JSON payload.");

      const category = normalizeText(parsed.data.category, 30).toLowerCase();
      if (!VALID_UPLOAD_CATEGORIES.includes(category as (typeof VALID_UPLOAD_CATEGORIES)[number])) {
        return sendErr(res, 400, "Invalid upload category.");
      }

      if (category === "certificates" && auth.user.role === "EDITOR") {
        return sendErr(res, 403, "Forbidden: Editors cannot upload certificate files.");
      }

      const contentType = normalizeText(parsed.data.contentType, 100).toLowerCase();
      const allowedExts = MIME_EXTENSIONS[contentType];
      if (!allowedExts) {
        return sendErr(res, 400, "Disallowed file content type. Allowed: JPEG, PNG, WebP, PDF.");
      }

      const fileSizeBytes = Number(parsed.data.fileSizeBytes);
      const maxLimit =
        category === "certificates" || contentType === "application/pdf"
          ? 10 * 1024 * 1024
          : 5 * 1024 * 1024;
      if (!Number.isInteger(fileSizeBytes) || fileSizeBytes <= 0 || fileSizeBytes > maxLimit) {
        return sendErr(res, 400, `File size must be a valid integer up to ${Math.round(maxLimit / (1024 * 1024))}MB.`);
      }

      const rawFilename = normalizeText(parsed.data.filename, 120);
      if (
        !rawFilename ||
        rawFilename.includes("..") ||
        rawFilename.includes("/") ||
        rawFilename.includes("\\")
      ) {
        return sendErr(res, 400, "Invalid filename.");
      }

      const safeName = rawFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const dotIdx = safeName.lastIndexOf(".");
      const ext = dotIdx !== -1 ? safeName.slice(dotIdx + 1).toLowerCase() : "";
      if (!ext || !allowedExts.includes(ext)) {
        return sendErr(res, 400, "Filename extension does not match declared MIME type.");
      }

      const r2Cfg = getR2Config();
      if (!r2Cfg) {
        return sendErr(res, 503, "Object storage service is not configured.");
      }

      const prefix = new Date().toISOString().slice(0, 7);
      const randomHex = crypto.randomBytes(6).toString("hex");
      const storageKey = `${category}/${prefix}/${Date.now()}_${randomHex}_${safeName}`;

      const client = createR2Client(r2Cfg);
      const command = new PutObjectCommand({
        Bucket: r2Cfg.bucket,
        Key: storageKey,
        ContentType: contentType,
        ContentLength: fileSizeBytes,
      });

      const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
      const fileId = `file_${crypto.randomUUID().slice(0, 18)}`;

      await db`
        INSERT INTO file_metadata (
          id, storage_key, bucket, file_name, content_type, file_size_bytes, category, created_at
        ) VALUES (
          ${fileId}, ${storageKey}, ${r2Cfg.bucket}, ${safeName},
          ${contentType}, ${fileSizeBytes}, ${category}, NOW()
        );
      `;

      await writeAuditLog(db, {
        action: "upload_presigned_issued",
        actor: auth.user.username,
        actorRole: auth.user.role,
        entityType: "file_metadata",
        entityId: fileId,
        ipAddress: ip,
        status: "success",
        details: { category, contentType, fileSizeBytes },
      });

      return sendJson(res, 200, {
        success: true,
        uploadUrl,
        storageKey,
        expiresInSeconds: 300,
      });
    }

    // --------------------------------------------------------------------------
    // GOOGLE FORM PROVISIONING: POST /api/integrations/google/create-form
    // --------------------------------------------------------------------------
    if (pathname === "/api/integrations/google/create-form" && req.method === "POST") {
      const auth = await requireAuth(db, req, res, ["SUPER_ADMIN", "ADMIN"]);
      if (!auth.authorized || !auth.user) return;

      const rateOk = await enforceRateLimit(
        db,
        res,
        `admin_mutation:user:${auth.user.id}`,
        40,
        5 * 60 * 1000
      );
      if (!rateOk) return;

      const gasCfg = getGasConfig();
      if (!gasCfg) {
        return sendErr(res, 503, "Google Apps Script integration is not configured on the server.");
      }

      const parsed = await parseBody<Record<string, unknown>>(req);
      if (parsed.tooLarge) return sendErr(res, 413, "Request payload too large.");
      if (!parsed.ok) return sendErr(res, 400, "Invalid JSON payload.");
      const body = parsed.data;

      const eventId = normalizeText(body.eventId, 100);
      if (!eventId) return sendErr(res, 400, "eventId is required.");

      const events = await db`
        SELECT id, slug, title, description, date, time, venue, category
        FROM chapter_events
        WHERE id = ${eventId} OR slug = ${eventId}
        LIMIT 1;
      `;

      const dbEvent = events[0];
      const eventTitle = dbEvent ? String(dbEvent.title) : normalizeText(body.title, 200);
      if (!eventTitle) {
        return sendErr(res, 404, "Event not found and event title was not provided.");
      }

      try {
        const resp = await fetch(gasCfg.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            action: "create_event",
            apiKey: gasCfg.secret,
            payload: {
              id: dbEvent ? dbEvent.id : eventId,
              title: eventTitle,
              description: dbEvent ? dbEvent.description || "" : normalizeText(body.description, 2000),
              date: dbEvent ? dbEvent.date || "" : normalizeText(body.date, 50),
              time: dbEvent ? dbEvent.time || "" : normalizeText(body.time, 100),
              venue: dbEvent ? dbEvent.venue || "IARE Campus" : normalizeText(body.venue, 250) || "IARE Campus",
              category: dbEvent ? dbEvent.category || "Workshop" : "Workshop",
              registrationOpen: body.registrationOpen !== false,
              spreadsheetId: gasCfg.spreadsheetId,
            },
          }),
        });

        if (!resp.ok) {
          return sendErr(res, 502, "Google Apps Script returned an upstream error.");
        }

        const data = (await resp.json()) as {
          success?: boolean;
          formId?: string;
          formUrl?: string;
          formEditUrl?: string;
          error?: string;
        };

        const validResponderUrl = validateHttpUrl(data.formUrl, ["docs.google.com", "forms.gle"]);
        if (!data.success || !data.formId || !validResponderUrl) {
          return sendErr(res, 502, data.error || "Google Apps Script did not return a valid Google Form.");
        }

        const validEditUrl = validateHttpUrl(data.formEditUrl, ["docs.google.com"]) || "";

        if (dbEvent) {
          await db`
            UPDATE chapter_events SET
              google_form_id = ${String(data.formId).slice(0, 150)},
              google_form_url = ${validResponderUrl},
              google_form_edit_url = ${validEditUrl},
              registration_url = ${validResponderUrl},
              form_status = 'active',
              updated_at = NOW()
            WHERE id = ${dbEvent.id};
          `;
        }

        await writeAuditLog(db, {
          action: "google_form_created",
          actor: auth.user.username,
          actorRole: auth.user.role,
          entityType: "chapter_events",
          entityId: dbEvent ? String(dbEvent.id) : eventId,
          ipAddress: ip,
          status: "success",
          details: { formId: String(data.formId).slice(0, 80) },
        });

        return sendJson(res, 200, {
          success: true,
          form: { formId: data.formId, responderUrl: validResponderUrl },
          message: "Google Form created successfully",
        });
      } catch {
        return sendErr(res, 502, "Unable to reach Google Apps Script provisioning service.");
      }
    }

    // --------------------------------------------------------------------------
    // GOOGLE FORM TOGGLE: POST /api/integrations/google/toggle-registration
    // --------------------------------------------------------------------------
    if (pathname === "/api/integrations/google/toggle-registration" && req.method === "POST") {
      const auth = await requireAuth(db, req, res, ["SUPER_ADMIN", "ADMIN"]);
      if (!auth.authorized || !auth.user) return;

      const rateOk = await enforceRateLimit(
        db,
        res,
        `admin_mutation:user:${auth.user.id}`,
        40,
        5 * 60 * 1000
      );
      if (!rateOk) return;

      const gasCfg = getGasConfig();
      if (!gasCfg) {
        return sendErr(res, 503, "Google Apps Script integration is not configured on the server.");
      }

      const parsed = await parseBody<{ eventId?: unknown; open?: unknown }>(req);
      if (parsed.tooLarge) return sendErr(res, 413, "Request payload too large.");
      if (!parsed.ok) return sendErr(res, 400, "Invalid JSON payload.");

      const eventId = normalizeText(parsed.data.eventId, 100);
      if (!eventId) return sendErr(res, 400, "eventId is required.");
      const open = Boolean(parsed.data.open);

      try {
        const resp = await fetch(gasCfg.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            action: "toggle_registration",
            apiKey: gasCfg.secret,
            payload: { id: eventId, open },
          }),
        });

        if (!resp.ok) {
          return sendErr(res, 502, "Google Apps Script returned an upstream error.");
        }

        const data = (await resp.json()) as { success?: boolean; error?: string };
        if (!data.success) {
          return sendErr(res, 502, data.error || "Failed to update Google Form status.");
        }

        await db`
          UPDATE chapter_events SET registration_open = ${open}, updated_at = NOW()
          WHERE id = ${eventId} OR slug = ${eventId};
        `;

        await writeAuditLog(db, {
          action: "google_form_toggled",
          actor: auth.user.username,
          actorRole: auth.user.role,
          entityType: "chapter_events",
          entityId: eventId,
          ipAddress: ip,
          status: "success",
          details: { open },
        });

        return sendJson(res, 200, { success: true, eventId, registrationOpen: open });
      } catch {
        return sendErr(res, 502, "Unable to communicate with Google Apps Script service.");
      }
    }

    // --------------------------------------------------------------------------
    // GOOGLE SYNC REGISTRATIONS: POST /api/integrations/google/sync-registrations
    // --------------------------------------------------------------------------
    if (pathname === "/api/integrations/google/sync-registrations" && req.method === "POST") {
      const auth = await requireAuth(db, req, res, ["SUPER_ADMIN", "ADMIN"]);
      if (!auth.authorized || !auth.user) return;

      const rateOk = await enforceRateLimit(
        db,
        res,
        `admin_mutation:user:${auth.user.id}`,
        40,
        5 * 60 * 1000
      );
      if (!rateOk) return;

      const gasCfg = getGasConfig();
      if (!gasCfg) {
        return sendErr(res, 503, "Google Apps Script integration is not configured on the server.");
      }

      const parsed = await parseBody<{ eventId?: unknown }>(req);
      if (parsed.tooLarge) return sendErr(res, 413, "Request payload too large.");
      if (!parsed.ok) return sendErr(res, 400, "Invalid JSON payload.");

      const eventId = normalizeText(parsed.data.eventId, 100);
      if (!eventId) return sendErr(res, 400, "eventId is required.");

      try {
        const resp = await fetch(gasCfg.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            action: "sync_registrations",
            apiKey: gasCfg.secret,
            payload: { eventId },
          }),
        });

        if (!resp.ok) {
          return sendErr(res, 502, "Google Apps Script returned an upstream error.");
        }

        const data = (await resp.json()) as {
          success?: boolean;
          syncedCount?: unknown;
          registrations?: unknown[];
          error?: unknown;
        };

        await writeAuditLog(db, {
          action: "google_registrations_synced",
          actor: auth.user.username,
          actorRole: auth.user.role,
          entityType: "event_registrations",
          entityId: eventId,
          ipAddress: ip,
          status: data.success ? "success" : "failure",
        });

        if (!data.success) {
          return sendErr(res, 502, "Google Apps Script registration sync failed.");
        }

        const safeRegistrations = Array.isArray(data.registrations)
          ? data.registrations.slice(0, 500).map((item) => {
              const r = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
              return {
                registrationId: normalizeText(r.registrationId ?? r.id, 100),
                eventId: normalizeText(r.eventId, 100),
                attendeeName: normalizeText(r.attendeeName ?? r.fullName ?? r.name, 160),
                email: normalizeText(r.email, 255),
                phone: normalizeText(r.phone, 40),
                rollNumber: normalizeText(r.rollNumber, 50),
                department: normalizeText(r.department, 120),
                yearOfStudy: normalizeText(r.yearOfStudy, 50),
                submittedAt: normalizeText(r.submittedAt, 64),
              };
            })
          : [];

        return sendJson(res, 200, {
          success: true,
          syncedCount: Number.isFinite(Number(data.syncedCount)) ? Math.max(0, Math.trunc(Number(data.syncedCount))) : 0,
          registrations: safeRegistrations,
        });
      } catch {
        return sendErr(res, 502, "Unable to sync registrations from Google Apps Script.");
      }
    }

    // --------------------------------------------------------------------------
    // GOOGLE WEBHOOK SYNC: POST /api/integrations/google/webhook
    // --------------------------------------------------------------------------
    if (pathname === "/api/integrations/google/webhook" && req.method === "POST") {
      const rateOk = await enforceRateLimit(
        db,
        res,
        `google_webhook:ip:${ip}`,
        60,
        5 * 60 * 1000
      );
      if (!rateOk) return;

      const gasCfg = getGasConfig();
      if (!gasCfg?.secret) {
        return sendErr(res, 503, "Webhook integration is not configured.");
      }

      const headerSecret =
        typeof req.headers["x-webhook-secret"] === "string"
          ? req.headers["x-webhook-secret"].trim()
          : "";
      const bearerSecret =
        typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ")
          ? req.headers.authorization.slice(7).trim()
          : "";
      const incomingSecret = headerSecret || bearerSecret;

      if (!timingSafeSecretEqual(incomingSecret, gasCfg.secret)) {
        await writeAuditLog(db, {
          action: "google_webhook_unauthorized",
          actor: "google_apps_script",
          ipAddress: ip,
          status: "failure",
        });
        return sendErr(res, 401, "Unauthorized webhook secret.");
      }

      const parsed = await parseBody<Record<string, unknown>>(req);
      if (parsed.tooLarge) return sendErr(res, 413, "Request payload too large.");
      if (!parsed.ok) return sendErr(res, 400, "Invalid JSON payload.");
      const body = parsed.data;

      const eventId = normalizeText(body.eventId, 100);
      const fullName = normalizeText(body.fullName, 160);
      const cleanEmail = normalizeText(body.email, 255).toLowerCase();

      if (!eventId || !fullName || !cleanEmail) {
        return sendErr(res, 400, "Missing required fields (eventId, fullName, email).");
      }
      if (!EMAIL_REGEX.test(cleanEmail)) {
        return sendErr(res, 400, "Invalid email address in webhook payload.");
      }

      const targetEvents = await db`
        SELECT id, title FROM chapter_events
        WHERE id = ${eventId} AND is_archived = false
        LIMIT 1;
      `;
      if (targetEvents.length === 0) {
        return sendErr(res, 404, "Target event does not exist.");
      }

      const regId = `reg_${crypto.randomUUID().slice(0, 18)}`;
      const eventTitle = normalizeText(body.eventTitle, 200) || String(targetEvents[0].title);

      await db`
        INSERT INTO event_registrations (
          id, event_id, event_title, full_name, email, roll_number,
          department, year_of_study, phone, answers, sync_source, submitted_at
        ) VALUES (
          ${regId},
          ${eventId},
          ${eventTitle},
          ${fullName},
          ${cleanEmail},
          ${body.rollNumber ? normalizeText(body.rollNumber, 50).toUpperCase() : null},
          ${body.department ? normalizeText(body.department, 100) : null},
          ${body.yearOfStudy ? normalizeText(body.yearOfStudy, 50) : null},
          ${body.phone ? normalizeText(body.phone, 40) : null},
          ${JSON.stringify(
            body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
              ? body.answers
              : {}
          )}::jsonb,
          'google_forms',
          NOW()
        );
      `;

      await db`
        UPDATE chapter_events SET response_count = response_count + 1, updated_at = NOW()
        WHERE id = ${eventId};
      `;

      await writeAuditLog(db, {
        action: "google_webhook_registration",
        actor: "google_apps_script",
        entityType: "event_registrations",
        entityId: regId,
        ipAddress: ip,
        status: "success",
        details: { eventId },
      });

      return sendJson(res, 200, { success: true, registrationId: regId });
    }

    // --------------------------------------------------------------------------
    // SUPER_ADMIN AUDIT LOGS: GET /api/admin/audit-logs
    // --------------------------------------------------------------------------
    if (pathname === "/api/admin/audit-logs" && req.method === "GET") {
      const auth = await requireAuth(db, req, res, ["SUPER_ADMIN"]);
      if (!auth.authorized || !auth.user) return;

      const rateOk = await enforceRateLimit(
        db,
        res,
        `admin_export:user:${auth.user.id}`,
        60,
        5 * 60 * 1000
      );
      if (!rateOk) return;

      const rawLimit = Number(parsedUrl.searchParams.get("limit") || 100);
      const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 250) : 100;

      const logs = await db`
        SELECT id, action, actor, actor_role, entity_type, entity_id, ip_address, status, details, created_at
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT ${limit};
      `;
      return sendJson(res, 200, { success: true, count: logs.length, logs });
    }

    // --------------------------------------------------------------------------
    // SUPER_ADMIN USERS: GET & POST /api/admin/users
    // --------------------------------------------------------------------------
    if (pathname === "/api/admin/users") {
      const auth = await requireAuth(db, req, res, ["SUPER_ADMIN"]);
      if (!auth.authorized || !auth.user) return;

      if (req.method === "GET") {
        const rateOk = await enforceRateLimit(
          db,
          res,
          `admin_export:user:${auth.user.id}`,
          60,
          5 * 60 * 1000
        );
        if (!rateOk) return;

        const users = await db`
          SELECT id, username, email, role, full_name, is_active, last_login_at, password_changed_at, created_at
          FROM admin_users
          ORDER BY created_at ASC;
        `;
        return sendJson(res, 200, { success: true, count: users.length, users });
      }

      if (req.method === "POST") {
        const rateOk = await enforceRateLimit(
          db,
          res,
          `admin_mutation:user:${auth.user.id}`,
          40,
          5 * 60 * 1000
        );
        if (!rateOk) return;

        const parsed = await parseBody<{
          username?: unknown;
          email?: unknown;
          role?: unknown;
          fullName?: unknown;
          password?: unknown;
          isActive?: unknown;
        }>(req);
        if (parsed.tooLarge) return sendErr(res, 413, "Request payload too large.");
        if (!parsed.ok) return sendErr(res, 400, "Invalid JSON payload.");

        const username = normalizeText(parsed.data.username, 50).toLowerCase();
        const email = normalizeText(parsed.data.email, 255).toLowerCase();
        const rawRole = normalizeText(parsed.data.role, 30).toUpperCase();
        const fullName = normalizeText(parsed.data.fullName, 160);
        const password = typeof parsed.data.password === "string" ? parsed.data.password.trim() : "";

        if (!username || !USERNAME_REGEX.test(username)) {
          return sendErr(res, 400, "Username must be 3-50 lowercase letters, numbers, '.', '_', or '-'.");
        }
        if (!email || !EMAIL_REGEX.test(email)) {
          return sendErr(res, 400, "A valid email address is required.");
        }
        if (!VALID_ROLES.includes(rawRole as AdminRole)) {
          return sendErr(res, 400, "Role must be one of SUPER_ADMIN, ADMIN, EDITOR, VIEWER.");
        }
        const role = rawRole as AdminRole;

        const existing = await db`
          SELECT id, role, is_active FROM admin_users
          WHERE LOWER(username) = ${username} OR LOWER(email) = ${email}
          LIMIT 1;
        `;

        if (existing.length > 0) {
          const targetId = String(existing[0].id);
          const nextActive = typeof parsed.data.isActive === "boolean"
            ? parsed.data.isActive
            : Boolean(existing[0].is_active);
          const roleChanged = normalizeRole(String(existing[0].role)) !== role;
          const deactivated = nextActive === false;
          const passwordUpdated = Boolean(password);

          if (passwordUpdated && password.length < 12) {
            return sendErr(res, 400, "A new password must be at least 12 characters long.");
          }

          if (passwordUpdated) {
            const salt = await bcrypt.genSalt(12);
            const newHash = await bcrypt.hash(password, salt);
            await db`
              UPDATE admin_users
              SET role = ${role},
                  is_active = ${nextActive},
                  full_name = COALESCE(NULLIF(${fullName}, ''), full_name),
                  password_hash = ${newHash},
                  password_changed_at = NOW(),
                  updated_at = NOW()
              WHERE id = ${targetId};
            `;
          } else {
            await db`
              UPDATE admin_users
              SET role = ${role},
                  is_active = ${nextActive},
                  full_name = COALESCE(NULLIF(${fullName}, ''), full_name),
                  updated_at = NOW()
              WHERE id = ${targetId};
            `;
          }

          // Rotate / revoke active sessions on privilege, status, or credential changes
          if (roleChanged || deactivated || passwordUpdated) {
            await db`DELETE FROM admin_sessions WHERE user_id = ${targetId};`;
          }

          await writeAuditLog(db, {
            action: "admin_user_updated",
            actor: auth.user.username,
            actorRole: auth.user.role,
            entityType: "admin_users",
            entityId: targetId,
            ipAddress: ip,
            status: "success",
            details: { username, role, isActive: nextActive, passwordUpdated },
          });

          return sendJson(res, 200, { success: true, message: `User '${username}' updated to ${role}` });
        }

        if (!password || password.length < 12) {
          return sendErr(res, 400, "A secure password of at least 12 characters is required.");
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);
        const newId = `usr_${crypto.randomUUID().slice(0, 18)}`;

        await db`
          INSERT INTO admin_users (
            id, username, email, password_hash, role, full_name, is_active, password_changed_at
          ) VALUES (
            ${newId}, ${username}, ${email}, ${passwordHash}, ${role},
            ${fullName || "e-DAM Officer"}, true, NOW()
          );
        `;

        await writeAuditLog(db, {
          action: "admin_user_created",
          actor: auth.user.username,
          actorRole: auth.user.role,
          entityType: "admin_users",
          entityId: newId,
          ipAddress: ip,
          status: "success",
          details: { username, role },
        });

        return sendJson(res, 201, { success: true, userId: newId });
      }
    }

    return sendErr(res, 404, "API route not found.");
  } catch (err) {
    console.error("API Exception on route:", pathname, err instanceof Error ? err.message : "error");
    return sendErr(res, 500, "An internal server error occurred.");
  }
}
