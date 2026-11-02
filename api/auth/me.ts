import type { IncomingMessage, ServerResponse } from "http";
import { AuthService } from "../../src/server/auth/auth.service";
import {
  sendJson,
  applyCorsHeaders,
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
