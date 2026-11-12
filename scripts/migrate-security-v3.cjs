const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

// Load environment variables from .env.local or .env without overriding existing process.env
for (const filename of [".env.local", ".env"]) {
  const envPath = path.join(__dirname, "..", filename);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("CRITICAL: DIRECT_URL or DATABASE_URL must be configured.");
  process.exit(1);
}

const sql = neon(dbUrl);

async function runSecurityMigrationV3() {
  console.log("==========================================================");
  console.log("Neon PostgreSQL Security Hardening Migration (v3)");
  console.log("==========================================================");

  await sql`
    CREATE TABLE IF NOT EXISTS api_rate_limits (
      rate_key VARCHAR(255) PRIMARY KEY,
      hit_count INT NOT NULL DEFAULT 1,
      window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON api_rate_limits(window_start);`;

  // Ensure audit_logs columns and indexes exist
  await sql`
    ALTER TABLE audit_logs
      ADD COLUMN IF NOT EXISTS actor_role VARCHAR(50),
      ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100);
  `;

  console.log("✓ api_rate_limits table and indexes verified.");
  console.log("✓ Security Migration v3 completed safely without altering existing data.");
}

runSecurityMigrationV3().catch((err) => {
  console.error("Security Migration v3 failed:", err.message);
  process.exit(1);
});

