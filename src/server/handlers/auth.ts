import type { IncomingMessage, ServerResponse } from "http";
import { AuthService } from "../auth/auth.service";
import {
  parseBody,
  sendJson,
  sendError,
  applyCorsHeaders,
  getClientIp,
  extractSessionToken,
  setAuthCookie,
  clearAuthCookie,
} from "../utils/api-handler";

export async function handleAuthLogin(req: IncomingMessage, res: ServerResponse) {
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
    const body = await parseBody<{ username?: string; password?: string }>(req);
    const username = (body.username || "").trim();
    const password = (body.password || "").trim();

    if (!username || !password) {
      return sendError(res, 400, "Invalid username or password.");
    }

    const ip = getClientIp(req);
    const userAgent = (req.headers["user-agent"] || "").slice(0, 255);

    const result = await AuthService.authenticateUser(username, password, ip, userAgent);

    if (!result.success || !result.session) {
      return sendError(res, result.status, result.error || "Invalid username or password.");
    }

    setAuthCookie(res, result.session.token);

    return sendJson(res, 200, {
      success: true,
      message: "Authentication successful",
      user: result.session.user,
    });
  } catch (err: unknown) {
    console.error("Login handler exception:", err);
    return sendError(res, 500, "An internal authentication error occurred.");
  }
}

export async function handleAuthLogout(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const token = extractSessionToken(req);
  const ip = getClientIp(req);

  if (token) {
    await AuthService.invalidateSession(token, ip);
  }

  clearAuthCookie(res);

  return sendJson(res, 200, {
    success: true,
    message: "Logged out successfully",
  });
}

export async function handleAuthMe(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const token = extractSessionToken(req);

  if (!token) {
    return sendJson(res, 200, {
      authenticated: false,
      user: null,
    });
  }

  const session = await AuthService.validateSession(token);

  if (!session.valid || !session.user) {
    clearAuthCookie(res);
    return sendJson(res, 200, {
      authenticated: false,
      user: null,
      reason: session.error || "Session invalid",
    });
  }

  return sendJson(res, 200, {
    authenticated: true,
    user: session.user,
  });
}

