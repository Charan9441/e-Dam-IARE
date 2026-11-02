import type { IncomingMessage, ServerResponse } from "http";
import { getDatabaseHealth } from "../src/server/db";
import { getR2Health } from "../src/server/storage/r2";
import { sendJson, applyCorsHeaders } from "../src/server/utils/api-handler";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const dbHealth = await getDatabaseHealth();
  const r2Health = await getR2Health();

  const isHealthy = dbHealth.connected && r2Health.connected;

  sendJson(res, isHealthy ? 200 : 503, {
    status: isHealthy ? "healthy" : "degraded",
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
    services: {
      neonDatabase: {
        connected: dbHealth.connected,
        latencyMs: dbHealth.latencyMs,
      },
      cloudflareR2: {
        connected: r2Health.connected,
        latencyMs: r2Health.latencyMs,
      },
      googleAppsScript: {
        configured: Boolean(process.env.GOOGLE_APPS_SCRIPT_URL),
      },
    },
  });
}
