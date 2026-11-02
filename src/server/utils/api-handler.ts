import type { IncomingMessage, ServerResponse } from "http";
import { AuthService, type AuthenticatedUser } from "../auth/auth.service";
import type { Permission } from "../auth/rbac";

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
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const list = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return list.trim();
  }
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0].trim() : realIp.trim();
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
  const host = req.headers.host;

  // Restrict CORS strictly to matching host or local dev
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (host && originUrl.host === host) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      } else if (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1") {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
    } catch {
      // Ignore malformed origin header
    }
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-CSRF-Token"
  );
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
  const host = req.headers.host;

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
      if (originHost.startsWith("localhost") || originHost.startsWith("127.0.0.1")) return true;
      return false;
    } catch {
      return false;
    }
  }

  // If no origin header, check referer
  const referer = req.headers.referer;
  if (referer && host) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) return true;
      if (refererHost.startsWith("localhost") || refererHost.startsWith("127.0.0.1")) return true;
      return false;
    } catch {
      return false;
    }
  }

  // Allow server-to-server requests without Origin if authorization header is present
  if (req.headers.authorization) {
    return true;
  }

  return true;
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
  const isProd = process.env.NODE_ENV === "production";
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
  const isProd = process.env.NODE_ENV === "production";
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
