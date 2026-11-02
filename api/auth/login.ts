import type { IncomingMessage, ServerResponse } from "http";
import { AuthService } from "../../src/server/auth/auth.service";
import {
  parseBody,
  sendJson,
  sendError,
  applyCorsHeaders,
  getClientIp,
  setAuthCookie,
} from "../../src/server/utils/api-handler";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
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

    // Set HTTP-Only SameSite cookie
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
