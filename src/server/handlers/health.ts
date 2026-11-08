import type { IncomingMessage, ServerResponse } from "http";
import { getDatabaseHealth } from "../db";
import { getR2Health } from "../storage/r2";
import { sendJson, applyCorsHeaders } from "../utils/api-handler";

export async function handleHealth(req: IncomingMessage, res: ServerResponse) {
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

