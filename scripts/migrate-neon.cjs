const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { neon } = require('@neondatabase/serverless');

// Load env
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

async function run() {
  console.log("==================================================");
  console.log("Starting Neon PostgreSQL Migration for e-DAM IARE");
  console.log("==================================================\n");

  // 1. chapter_events
  console.log("1. Migrating chapter_events table...");
  await sql`
    CREATE TABLE IF NOT EXISTS chapter_events (
      id VARCHAR(100) PRIMARY KEY,
      slug VARCHAR(200) UNIQUE NOT NULL,
      title TEXT NOT NULL,
      tagline TEXT,
      category VARCHAR(50),
      status VARCHAR(50) DEFAULT 'upcoming',
      date VARCHAR(50),
      time VARCHAR(100),
      venue TEXT,
      mode VARCHAR(50) DEFAULT 'offline',
      description TEXT,
      detailed_overview JSONB DEFAULT '[]'::jsonb,
      prerequisites JSONB DEFAULT '[]'::jsonb,
      takeaways JSONB DEFAULT '[]'::jsonb,
      speakers JSONB DEFAULT '[]'::jsonb,
      registration_deadline VARCHAR(50),
      registration_open BOOLEAN DEFAULT true,
      registration_url TEXT,
      google_form_id VARCHAR(150),
      google_form_url TEXT,
      google_form_edit_url TEXT,
      form_status VARCHAR(50) DEFAULT 'active',
      form_config JSONB,
      response_count INT DEFAULT 0,
      banner_image TEXT,
      capacity INT DEFAULT 100,
      featured BOOLEAN DEFAULT false,
      is_archived BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_slug ON chapter_events(slug);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_date ON chapter_events(date);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_status ON chapter_events(status);`;
  console.log("✓ chapter_events table and indexes verified.");

  // 2. event_registrations
  console.log("2. Migrating event_registrations table...");
  await sql`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id VARCHAR(100) PRIMARY KEY,
      event_id VARCHAR(100) REFERENCES chapter_events(id) ON DELETE CASCADE,
      event_title TEXT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      roll_number VARCHAR(50),
      department VARCHAR(100),
      year_of_study VARCHAR(50),
      phone VARCHAR(50),
      answers JSONB DEFAULT '{}'::jsonb,
      sync_source VARCHAR(50) DEFAULT 'google_forms',
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_reg_event ON event_registrations(event_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reg_email ON event_registrations(LOWER(email));`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reg_roll ON event_registrations(roll_number);`;
  console.log("✓ event_registrations table and indexes verified.");

  // 3. certificate_templates
  console.log("3. Migrating certificate_templates table...");
  await sql`
    CREATE TABLE IF NOT EXISTS certificate_templates (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      type VARCHAR(50) DEFAULT 'participation',
      title TEXT NOT NULL DEFAULT 'Certificate of Completion',
      subtitle TEXT DEFAULT 'This is proudly presented to',
      body_template TEXT NOT NULL,
      issuer_organization TEXT DEFAULT 'e-DAM Student Chapter, Institute of Aeronautical Engineering (IARE)',
      signatories JSONB DEFAULT '[]'::jsonb,
      branding JSONB DEFAULT '{}'::jsonb,
      layout JSONB DEFAULT '{"orientation": "landscape", "primaryColor": "#8B5CF6", "accentColor": "#030305"}'::jsonb,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log("✓ certificate_templates table verified.");

  // 4. issued_certificates
  console.log("4. Migrating issued_certificates table...");
  await sql`
    CREATE TABLE IF NOT EXISTS issued_certificates (
      id VARCHAR(100) PRIMARY KEY,
      certificate_number VARCHAR(100) UNIQUE NOT NULL,
      event_id VARCHAR(100) REFERENCES chapter_events(id) ON DELETE SET NULL,
      registration_id VARCHAR(100) REFERENCES event_registrations(id) ON DELETE SET NULL,
      template_id VARCHAR(100) REFERENCES certificate_templates(id) ON DELETE SET NULL,
      recipient_name TEXT NOT NULL,
      recipient_email VARCHAR(255) NOT NULL,
      recipient_roll_number VARCHAR(50),
      recipient_department VARCHAR(100),
      event_title TEXT NOT NULL,
      event_date VARCHAR(50),
      certificate_type VARCHAR(50) DEFAULT 'participation',
      status VARCHAR(50) DEFAULT 'valid',
      revoked_at TIMESTAMPTZ,
      revoked_reason TEXT,
      pdf_storage_key TEXT NOT NULL,
      pdf_file_size INT DEFAULT 0,
      qr_verification_url TEXT NOT NULL,
      issued_at TIMESTAMPTZ DEFAULT NOW(),
      issued_by VARCHAR(100) DEFAULT 'admin'
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_cert_number ON issued_certificates(certificate_number);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_cert_email ON issued_certificates(LOWER(recipient_email));`;
  await sql`CREATE INDEX IF NOT EXISTS idx_cert_event ON issued_certificates(event_id);`;
  console.log("✓ issued_certificates table and indexes verified.");

  // 5. admin_users
  console.log("5. Migrating admin_users table...");
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(100) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      full_name VARCHAR(200),
      is_active BOOLEAN DEFAULT true,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_user ON admin_users(LOWER(username));`;
  console.log("✓ admin_users table verified.");

  // 6. admin_sessions
  console.log("6. Migrating admin_sessions table...");
  await sql`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(100) REFERENCES admin_users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON admin_sessions(token);`;
  console.log("✓ admin_sessions table verified.");

  // 7. file_metadata
  console.log("7. Migrating file_metadata table...");
  await sql`
    CREATE TABLE IF NOT EXISTS file_metadata (
      id VARCHAR(100) PRIMARY KEY,
      storage_key TEXT UNIQUE NOT NULL,
      bucket VARCHAR(100) NOT NULL,
      file_name TEXT NOT NULL,
      content_type VARCHAR(100) NOT NULL,
      file_size_bytes INT NOT NULL,
      category VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50),
      entity_id VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_file_storage_key ON file_metadata(storage_key);`;
  console.log("✓ file_metadata table verified.");

  // 8. audit_logs
  console.log("8. Migrating audit_logs table...");
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      actor VARCHAR(100) DEFAULT 'admin',
      entity_id VARCHAR(100),
      status VARCHAR(50),
      details JSONB DEFAULT '{}'::jsonb,
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log("✓ audit_logs table verified.");

  // 9. Seed default admin user if not exists
  console.log("\n9. Checking default administrator...");
  const adminCheck = await sql`SELECT count(*) FROM admin_users WHERE username = 'admin'`;
  if (Number(adminCheck[0]?.count || 0) === 0) {
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('edam2026', salt);
    await sql`
      INSERT INTO admin_users (id, username, email, password_hash, role, full_name, is_active)
      VALUES (
        'usr_edam_primary_admin',
        'admin',
        'edam.iare@gmail.com',
        ${passHash},
        'super_admin',
        'e-DAM Executive Administrator',
        true
      );
    `;
    console.log("✓ Seeded primary administrator (username: admin, pass: edam2026)");
  } else {
    console.log("✓ Primary administrator already exists.");
  }

  // 10. Seed default certificate templates if not exists
  console.log("10. Checking certificate templates...");
  const tmplCheck = await sql`SELECT count(*) FROM certificate_templates`;
  if (Number(tmplCheck[0]?.count || 0) === 0) {
    await sql`
      INSERT INTO certificate_templates (
        id, name, description, type, title, subtitle, body_template,
        issuer_organization, signatories, branding, layout, is_active
      ) VALUES (
        'tmpl_edam_participation',
        'Official e-DAM IARE Participation Certificate',
        'Standard accredited certificate for design, engineering, and architecture bootcamps & assemblies.',
        'participation',
        'Certificate of Completion',
        'This is proudly presented to',
        'for demonstrating exemplary dedication and active participation in the professional workshop "{{event_title}}" convened by e-DAM, Institute of Aeronautical Engineering (IARE), Hyderabad.',
        'e-DAM Student Chapter, Institute of Aeronautical Engineering',
        '[
          {"name": "Faculty Coordinator", "role": "Faculty Advisor", "title": "Department of Aeronautical & Mechanical Engineering"},
          {"name": "Student Lead", "role": "President", "title": "e-DAM IARE"}
        ]'::jsonb,
        '{"primaryColor": "#8B5CF6", "accentColor": "#030305", "ribbonText": "e-DAM"}'::jsonb,
        '{"orientation": "landscape"}'::jsonb,
        true
      ),
      (
        'tmpl_edam_excellence',
        'e-DAM Design & Innovation Award of Excellence',
        'Distinguished certificate of merit for competition and hackathon winners.',
        'winner',
        'Certificate of Excellence',
        'This honor is conferred upon',
        'for extraordinary skill, creativity, and securing a winning position in the innovation challenge "{{event_title}}" presented by e-DAM, Institute of Aeronautical Engineering.',
        'e-DAM Student Chapter, Institute of Aeronautical Engineering',
        '[
          {"name": "Faculty Coordinator", "role": "Faculty Advisor", "title": "IARE Innovation Cell"},
          {"name": "Student Lead", "role": "Convener", "title": "e-DAM IARE"}
        ]'::jsonb,
        '{"primaryColor": "#C026FF", "accentColor": "#030305", "ribbonText": "EXCELLENCE"}'::jsonb,
        '{"orientation": "landscape"}'::jsonb,
        true
      );
    `;
    console.log("✓ Seeded default e-DAM certificate templates.");
  }

  // 11. Seed initial events if none exist
  console.log("11. Checking initial events...");
  const eventCheck = await sql`SELECT count(*) FROM chapter_events`;
  if (Number(eventCheck[0]?.count || 0) === 0) {
    await sql`
      INSERT INTO chapter_events (
        id, slug, title, tagline, category, status, date, time, venue, mode,
        description, detailed_overview, prerequisites, takeaways, speakers,
        registration_deadline, registration_open, registration_url, capacity, featured
      ) VALUES (
        'evt_cad_summit_2026',
        'cad-summit-2026',
        'National CAD & Generative Design Summit 2026',
        'Next-gen Computational Modelling & Fusion 360 Mastery',
        'Workshop',
        'upcoming',
        'Nov 15, 2026',
        '10:00 AM - 4:00 PM IST',
        'Auditorium Block, IARE Campus',
        'offline',
        'An intensive hands-on deep dive into advanced parametric modelling, topology optimization, and additive manufacturing workflows for multi-disciplinary engineers.',
        '["Introduction to algorithmic and generative topology", "Mesh refinement & stress concentration analysis", "Direct fabrication pipelines to 3D printers"]'::jsonb,
        '["Basic familiarity with 3D concepts", "Laptop with Autodesk Fusion 360 or SolidWorks installed"]'::jsonb,
        '["Official e-DAM Certificate of Completion", "Generative design starter templates & CAD asset libraries"]'::jsonb,
        '[{"name": "Dr. V. R. Sharma", "role": "Keynote Speaker", "title": "Senior CAE Consultant"}, {"name": "e-DAM Design Team", "role": "Mentors", "title": "Core Technical Council"}]'::jsonb,
        'Nov 14, 2026',
        true,
        'https://forms.gle/edam-cad-summit',
        150,
        true
      ),
      (
        'evt_uiux_sprint_2026',
        'uiux-design-sprint-2026',
        'UI/UX Design Sprint & Spatial Interfaces',
        'Architecting fluid digital experiences with Figma & Prototyping',
        'Hackathon',
        'upcoming',
        'Dec 02, 2026',
        '9:30 AM - 5:30 PM IST',
        'Computer Center Lab 4, IARE',
        'hybrid',
        'Rapid design sprints focusing on design systems, human-centered ergonomics, accessibility, and micro-interactions.',
        '["Design tokens & variable systems", "Interactive micro-animations & physics", "Portfolio review with industry leads"]'::jsonb,
        '["Interest in product design and interface aesthetics"]'::jsonb,
        '["Industry-grade portfolio project", "Certificate of Merit & swag kit"]'::jsonb,
        '[{"name": "Pooja Reddy", "role": "Lead Product Designer", "title": "Design Systems Lead"}]'::jsonb,
        'Dec 01, 2026',
        true,
        'https://forms.gle/edam-uiux-sprint',
        120,
        true
      );
    `;
    console.log("✓ Seeded starter e-DAM events.");
  }

  // 12. Final summary of public tables
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name;
  `;
  console.log("\n==================================================");
  console.log("All tables in Neon PostgreSQL database:");
  console.log(tables.map(t => t.table_name).join(', '));
  console.log("==================================================");
  console.log("Neon PostgreSQL Migration Completed Successfully!");
}

run().catch(err => {
  console.error("Migration Failed:", err);
  process.exit(1);
});
