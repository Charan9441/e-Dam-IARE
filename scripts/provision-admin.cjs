#!/usr/bin/env node
/**
 * Administrator Provisioning & Account Management CLI
 * System: e-DAM IARE
 * Usage: node scripts/provision-admin.cjs <username> <email> <password> [role] [fullName]
 * Roles: SUPER_ADMIN | ADMIN | EDITOR | VIEWER
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
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

const args = process.argv.slice(2);

if (args.length < 3) {
  console.log(`
========================================================================
e-DAM IARE — Administrator Account Provisioning Tool
========================================================================
Usage:
  node scripts/provision-admin.cjs <username> <email> <password> [role] [fullName]

Allowed Roles:
  - SUPER_ADMIN  (Complete administrative control & user management)
  - ADMIN        (Manage events, certificates, and registrations)
  - EDITOR       (Limited event & content editing, no deletions)
  - VIEWER       (Read-only inspection)

Examples:
  node scripts/provision-admin.cjs lead_editor editor@iare.ac.in SecurePass2026! EDITOR "Lead Content Editor"
  node scripts/provision-admin.cjs audit_viewer auditor@iare.ac.in ViewAudit2026! VIEWER "External Auditor"
========================================================================
  `);
  process.exit(0);
}

const [rawUsername, rawEmail, rawPassword, rawRole = "ADMIN", rawFullName = "e-DAM Officer"] = args;

const username = rawUsername.trim().toLowerCase();
const email = rawEmail.trim().toLowerCase();
const password = rawPassword.trim();
const role = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"].includes(rawRole.toUpperCase())
  ? rawRole.toUpperCase()
  : "ADMIN";

if (password.length < 12) {
  console.error("Error: Password must be at least 12 characters long for security compliance.");
  process.exit(1);
}

async function provision() {
  console.log(`Provisioning administrator '${username}' with role '${role}'...`);

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const existing = await sql`
    SELECT id, username, email, role FROM admin_users
    WHERE LOWER(username) = ${username} OR LOWER(email) = ${email}
    LIMIT 1;
  `;

  if (existing.length > 0) {
    const userId = existing[0].id;
    await sql`
      UPDATE admin_users
      SET 
        password_hash = ${passwordHash},
        role = ${role},
        full_name = ${rawFullName},
        is_active = true,
        failed_login_attempts = 0,
        locked_until = NULL,
        password_changed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${userId};
    `;

    await sql`
      INSERT INTO audit_logs (action, actor, actor_role, entity_type, entity_id, status, details)
      VALUES ('cli_admin_updated', 'system_cli', 'SUPER_ADMIN', 'admin_users', ${userId}, 'success', ${JSON.stringify({ username, role })}::jsonb);
    `;

    console.log(`✓ Successfully updated credentials and role for existing administrator: ${username} (${role})`);
  } else {
    const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await sql`
      INSERT INTO admin_users (
        id, username, email, password_hash, role, full_name, is_active, password_changed_at
      ) VALUES (
        ${newId},
        ${username},
        ${email},
        ${passwordHash},
        ${role},
        ${rawFullName},
        true,
        NOW()
      );
    `;

    await sql`
      INSERT INTO audit_logs (action, actor, actor_role, entity_type, entity_id, status, details)
      VALUES ('cli_admin_provisioned', 'system_cli', 'SUPER_ADMIN', 'admin_users', ${newId}, 'success', ${JSON.stringify({ username, role })}::jsonb);
    `;

    console.log(`✓ Successfully provisioned new administrator account: ${username} (${role})`);
  }
}

provision().catch(err => {
  console.error("Provisioning failed:", err);
  process.exit(1);
});

