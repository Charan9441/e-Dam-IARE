const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("CRITICAL: DIRECT_URL or DATABASE_URL must be provided in environment or .env/.env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

async function runSecurityMigration() {
  console.log("==========================================================");
  console.log("Starting Neon PostgreSQL Security Hardening Migration (v2)");
  console.log("==========================================================\n");

  // 1. Upgrade admin_users table
  console.log("1. Hardening admin_users schema...");
  await sql`
    ALTER TABLE admin_users
      ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(100),
      ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
  `;

  // Standardize existing admin user role to SUPER_ADMIN
  await sql`
    UPDATE admin_users
    SET role = 'SUPER_ADMIN'
    WHERE role = 'super_admin' OR username = 'admin';
  `;
  console.log("✓ admin_users table hardened and existing admin role normalized to SUPER_ADMIN");

  // 2. Upgrade admin_sessions table
  console.log("\n2. Hardening admin_sessions schema...");
  await sql`
    ALTER TABLE admin_sessions
      ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100),
      ADD COLUMN IF NOT EXISTS user_agent TEXT,
      ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON admin_sessions(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON admin_sessions(expires_at);`;
  console.log("✓ admin_sessions table updated with activity tracking and indexes");

  // 3. Create login_attempts table for brute force tracking
  console.log("\n3. Creating login_attempts table...");
  await sql`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id SERIAL PRIMARY KEY,
      identifier VARCHAR(255) NOT NULL,
      ip_address VARCHAR(100) NOT NULL,
      success BOOLEAN NOT NULL,
      attempted_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address, attempted_at);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier ON login_attempts(LOWER(identifier), attempted_at);`;
  console.log("✓ login_attempts table and rate-limiting indexes verified");

  // 4. Upgrade audit_logs table
  console.log("\n4. Hardening audit_logs schema...");
  await sql`
    ALTER TABLE audit_logs
      ADD COLUMN IF NOT EXISTS actor_role VARCHAR(50),
      ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100);
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);`;
  console.log("✓ audit_logs table hardened and indexed");

  // 5. Verification check
  const users = await sql`
    SELECT id, username, email, role, is_active, failed_login_attempts, locked_until
    FROM admin_users;
  `;
  console.log("\nVerified admin_users after migration:", users);

  console.log("\n==========================================================");
  console.log("Security Migration Completed Successfully!");
  console.log("==========================================================");
}

runSecurityMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});

