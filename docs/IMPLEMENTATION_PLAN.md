# Implementation Plan — e-DAM IARE

**Platform:** e-DAM IARE Community Platform  
**Target:** Production-grade student community web application  

---

## 1. Phased Execution Roadmap

### Phase 1: Audit & Foundation (Completed)
- [x] Codebase and dependencies audit
- [x] Verify Git remotes and project tree
- [x] Extract Google Apps Script mechanics and data contracts
- [x] Formulate architecture and documentation (`PROJECT_AUDIT.md`, `ARCHITECTURE.md`)
- [x] Install foundation packages: `convex`, `react-router-dom`, `pdf-lib`, `qrcode`

### Phase 2: Convex Backend Engineering (`convex/`)
- [x] Create `convex/schema.ts` defining:
  - `events`: title, slug, description, category, dates, venue, status, formUrl, formId, capacity, coverUrl
  - `registrations`: attendeeName, email, rollNumber, department, eventId, submittedAt
  - `certificates`: certificateNumber, recipientName, recipientEmail, recipientRollNumber, recipientDepartment, eventId, eventTitle, eventDate, certificateType, verificationCode, issueDate
  - `admin_users`: username, passwordHash, role, fullName, isActive, createdAt
  - `admin_sessions`: sessionTokenHash, userId, expiresAt, createdAt
  - `audit_logs`: action, targetId, status, details, actor, timestamp
- [x] Implement Queries:
  - `events.ts`: `listPublishedEvents`, `getEventBySlug`, `getAllEventsAdmin`, `getEventById`
  - `registrations.ts`: `getRegistrationsByEvent`
  - `certificates.ts`: `verifyCertificate`, `getCertificatesByEvent`
  - `auth.ts`: `validateSession`, `getAdminProfile`
  - `audit.ts`: `getAuditLogs`
- [x] Implement Mutations:
  - `events.ts`: `createEvent`, `updateEvent`, `toggleRegistration`, `archiveEvent`, `deleteEvent`, `updateGoogleFormLinks`
  - `certificates.ts`: `issueCertificate`, `revokeCertificate`, `bulkIssueCertificates`
  - `auth.ts`: `loginAdmin`, `logoutAdmin`, `bootstrapAdmin`
- [x] Implement Actions:
  - `googleAppsScript.ts`: Dispatch actions to Apps Script (`createEventWithForm`, `toggleFormRegistration`, `syncRegistrations`)
- [x] Implement HTTP Actions:
  - `http.ts`: Webhook receiver for Google Apps Script response sync

### Phase 3: Brand, UI/UX & Public Routing
- [x] Configure `react-router-dom` in `src/App.tsx` and `src/main.tsx`
- [x] Routes:
  - `/` (Home landing page with interactive hero, about, 5 domains, stats, 100 Days of Tech, team, projects)
  - `/events` (Live events directory with search and category filters)
  - `/events/:slug` (Individual event detail with direct Google Form registration)
  - `/initiatives` (100 Days of Tech roadmap and community initiatives)
  - `/domains` (Deep-dive on UI/UX, Cybersecurity, Data Science, Full-Stack, AI/ML)
  - `/verify` & `/verify/:certId` (Certificate verification portal with instant validation & PDF download)
  - `/admin/login` & `/admin` (Secure admin console)
  - `/privacy` & `/terms` (Data policy and student privacy disclosure)
- [x] Integrate authentic e-DAM visual identity and branding

### Phase 4: Google Workspace Automation Pipeline
- [x] Create dedicated e-DAM Google Apps Script in `google-apps-script/Code.gs` tailored for e-DAM branding
- [x] Test end-to-end event creation, form generation, and sheet registration sync
- [x] Provide exact step-by-step setup guide for the chapter administrator

### Phase 5: High-Resolution PDF Certificate Engine
- [x] Client-side vector certificate renderer with `pdf-lib` + `qrcode`
- [x] Embed e-DAM deep space branding, official fonts, gold borders, and QR verification code
- [x] Live certificate download and verification

### Phase 6: Admin Portal & RBAC Security
- [x] Admin authentication modal / page with session management
- [x] Event management (CRUD, publish/draft toggle, Google Form creation trigger)
- [x] Attendee viewer and certificate generator
- [x] Audit logs and system health monitor

### Phase 7: Quality Assurance & Build Verification
- [x] Run full TypeScript type check (`tsc -b`)
- [x] Run Oxlint / ESLint
- [x] Execute production build (`vite build`)
- [x] Document test execution and remaining manual configuration
