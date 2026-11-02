import type { IncomingMessage, ServerResponse } from "http";
import { AuthService } from "../../src/server/auth/auth.service";
import {
  sendJson,
  applyCorsHeaders,
  getClientIp,
  extractSessionToken,
  clearAuthCookie,
} from "../../src/server/utils/api-handler";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
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

  // Clear HTTP-Only authentication cookie
  clearAuthCookie(res);

  return sendJson(res, 200, {
    success: true,
    message: "Logged out successfully",
  });
}
