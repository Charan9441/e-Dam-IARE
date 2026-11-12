import type { IncomingMessage, ServerResponse } from "http";
import { AuthService, type AuthenticatedUser } from "../auth/auth.service.ts";
import type { Permission } from "../auth/rbac.ts";

export interface ApiRequest extends IncomingMessage {
  body?: any;
  query?: Record<string, string>;
  cookies?: Record<string, string>;
}

export interface ApiResponse extends ServerResponse {
  status?: (statusCode: number) => ApiResponse;
  json?: (data: any) => void;
}

/**
 * Extracts client IP address accurately from standard headers
 */
export function getClientIp(req: IncomingMessage): string {
  if (process.env.VERCEL === "1") {
    const vercelForwarded = req.headers["x-vercel-forwarded-for"];
    if (vercelForwarded) {
      const first = (Array.isArray(vercelForwarded) ? vercelForwarded[0] : vercelForwarded.split(",")[0]).trim();
      if (/^[0-9a-fA-F:.]{3,45}$/.test(first)) return first;
    }
    const realIp = req.headers["x-real-ip"];
    if (typeof realIp === "string" && /^[0-9a-fA-F:.]{3,45}$/.test(realIp.trim())) {
      return realIp.trim();
    }
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

/**
 * Parses JSON body from request
 */
export async function parseBody<T = any>(req: IncomingMessage): Promise<T> {
  const customReq = req as any;
  if (customReq.body !== undefined && customReq.body !== null) {
    if (typeof customReq.body === "string") {
      try {
        return JSON.parse(customReq.body);
      } catch {
        return {} as T;
      }
    }
    return customReq.body as T;
  }

  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      // Protection against oversized payloads (>2MB)
      if (raw.length > 2 * 1024 * 1024) {
        req.destroy();
        resolve({} as T);
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : ({} as T));
      } catch {
        resolve({} as T);
      }
    });
    req.on("error", () => resolve({} as T));
  });
}

/**
 * Validates CORS and sets restrictive origin headers
 */
export function applyCorsHeaders(req: IncomingMessage, res: ServerResponse): void {
  const origin = req.headers.origin;

  // Strict CORS policy: allow explicit production origin, ALLOWED_ORIGINS, or local dev
  res.setHeader("Vary", "Origin");
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
      const extraOrigins = (process.env.ALLOWED_ORIGINS || "https://e-dam-iare.vercel.app")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const isAllowed =
        extraOrigins.includes(originUrl.origin) ||
        (!isProd && (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1"));

      if (isAllowed) {
        res.setHeader("Access-Control-Allow-Origin", originUrl.origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, X-Requested-With, X-CSRF-Token"
        );
      }
    } catch {
      // Ignore malformed origin header
    }
  }
}

/**
 * Validates CSRF for state-changing requests (POST, PUT, DELETE)
 */
export function validateCsrf(req: IncomingMessage): boolean {
  const method = req.method?.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const origin = req.headers.origin;
  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://e-dam-iare.vercel.app")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (allowedOrigins.includes(originUrl.origin)) return true;
      if (!isProd && (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1")) return true;
      return false;
    } catch {
      return false;
    }
  }

  // If no origin header, check referer
  const referer = req.headers.referer;
  if (referer) {
    try {
      const refUrl = new URL(referer);
      if (allowedOrigins.includes(refUrl.origin)) return true;
      if (!isProd && (refUrl.hostname === "localhost" || refUrl.hostname === "127.0.0.1")) return true;
      return false;
    } catch {
      return false;
    }
  }

  const cookies = parseCookies(req);
  const viaCookie = Boolean(cookies["edam_admin_session"]);
  // Allow pure Bearer API requests without cookie; fail closed on cookie mutations lacking Origin/Referer
  if (req.headers.authorization?.startsWith("Bearer ") && !viaCookie) {
    return true;
  }

  return false;
}

/**
 * Returns JSON response with security headers
 */
export function sendJson(res: ServerResponse, status: number, data: any): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.end(JSON.stringify(data));
}

/**
 * Returns an error response
 */
export function sendError(
  res: ServerResponse,
  status: number,
  message: string,
  details?: any
): void {
  sendJson(res, status, {
    success: false,
    error: message,
    details: details || null,
  });
}

/**
 * Extract cookies from Cookie header
 */
export function parseCookies(req: IncomingMessage): Record<string, string> {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;

  if (rc) {
    rc.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      const key = parts[0]?.trim();
      const val = parts.slice(1).join("=").trim();
      if (key) list[key] = decodeURIComponent(val);
    });
  }
  return list;
}

/**
 * Sets secure HTTP-Only authentication cookie
 */
export function setAuthCookie(res: ServerResponse, token: string): void {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production";
  const secureFlag = isProd ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `edam_admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secureFlag}`
  );
}

/**
 * Clears authentication cookie
 */
export function clearAuthCookie(res: ServerResponse): void {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production";
  const secureFlag = isProd ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `edam_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`
  );
}

/**
 * Extract active token from Authorization header or Cookie
 */
export function extractSessionToken(req: IncomingMessage): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req);
  return cookies["edam_admin_session"] || null;
}

/**
 * Authenticates the incoming request and validates required RBAC permission
 */
export async function requireAuth(
  req: IncomingMessage,
  res: ServerResponse,
  requiredPermission?: Permission
): Promise<{ authorized: boolean; user?: AuthenticatedUser }> {
  applyCorsHeaders(req, res);

  // Validate CSRF
  if (!validateCsrf(req)) {
    sendError(res, 403, "Forbidden: CSRF validation failed.");
    return { authorized: false };
  }

  const token = extractSessionToken(req);
  if (!token) {
    sendError(res, 401, "Unauthorized: Authentication required.");
    return { authorized: false };
  }

  // Validate session in database
  const sessionResult = await AuthService.validateSession(token);
  if (!sessionResult.valid || !sessionResult.user) {
    clearAuthCookie(res);
    sendError(res, 401, "Unauthorized: Session is invalid or expired.");
    return { authorized: false };
  }

  const user = sessionResult.user;

  // Check specific RBAC permission if required
  if (requiredPermission && !AuthService.verifyPermission(user, requiredPermission)) {
    sendError(
      res,
      403,
      `Forbidden: Your role (${user.role}) does not have permission for '${requiredPermission}'.`
    );
    return { authorized: false };
  }

  return { authorized: true, user };
}

/**
 * Legacy wrapper for compatibility
 */
export async function verifyAdmin(
  req: IncomingMessage
): Promise<{ authenticated: boolean; user?: AuthenticatedUser }> {
  const token = extractSessionToken(req);
  if (!token) return { authenticated: false };

  const sessionResult = await AuthService.validateSession(token);
  if (!sessionResult.valid || !sessionResult.user) {
    return { authenticated: false };
  }

  return { authenticated: true, user: sessionResult.user };
}
