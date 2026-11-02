import { neon } from "@neondatabase/serverless";

// Server-side connection strings
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "";

export const directConnectionString =
  process.env.DIRECT_URL ||
  connectionString;

if (!connectionString && process.env.NODE_ENV === "production") {
  console.error("CRITICAL: DATABASE_URL is not configured in production environment!");
}

/**
 * Tagged template SQL client for executing parameterized queries against Neon.
 */
export const sql = neon(connectionString);

/**
 * Health check for Neon PostgreSQL connection
 */
export async function getDatabaseHealth(): Promise<{
  connected: boolean;
  latencyMs: number;
  database?: string;
  version?: string;
  timestamp?: string;
  counts?: {
    events: number;
    registrations: number;
    certificates: number;
  };
  error?: string;
}> {
  const start = Date.now();
  try {
    const rows = await sql`
      SELECT 
        version(),
        current_database() AS database,
        now() AS timestamp
    `;
    const latencyMs = Date.now() - start;
    const countEvents = await sql`SELECT count(*) FROM chapter_events`;
    const countRegs = await sql`SELECT count(*) FROM event_registrations`;
    const countCerts = await sql`SELECT count(*) FROM issued_certificates`;

    return {
      connected: true,
      latencyMs,
      database: String(rows[0]?.database || "neondb"),
      version: String(rows[0]?.version || ""),
      timestamp: String(rows[0]?.timestamp || new Date().toISOString()),
      counts: {
        events: Number(countEvents[0]?.count || 0),
        registrations: Number(countRegs[0]?.count || 0),
        certificates: Number(countCerts[0]?.count || 0),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: message,
    };
  }
}

