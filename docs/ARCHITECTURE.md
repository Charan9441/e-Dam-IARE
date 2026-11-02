# System Architecture — e-DAM IARE

**Platform:** e-DAM IARE Community Platform  
**Target Architecture:** React 19 (Vite) + Convex Serverless Backend + Google Workspace Automation Pipeline  

---

## 1. Architectural Overview

The e-DAM IARE platform is organized around a dual-tier serverless topology:
1. **Client Tier (Frontend):** A static Single Page Application (SPA) built with React 19, TypeScript, and Vite, styled with Tailwind CSS, utilizing client-side routing via `react-router-dom`.
2. **Backend & Persistence Tier (Convex):** A reactive document database with TypeScript schema validation, reactive real-time queries, atomic mutations, and server-side actions for external integrations.
3. **External Automation Pipeline (Google Workspace):** Google Apps Script Web App handling Google Drive `FormApp.create()`, response destination binding to Google Sheets, and bidirectional webhook synchronization.

```
+-------------------------------------------------------------------------+
|                              CLIENT BROWSER                             |
|  React 19 + TypeScript + Vite + Tailwind CSS + Lucide + react-router    |
|  - Landing Page (Hero, About, Domains, 100 Days of Tech, Stats, Team)   |
|  - Events Directory & Live Event Details                               |
|  - Real Google Form Registration Redirect / Embed                       |
|  - Certificate Verification Portal (/verify & /verify/:id)              |
|  - PDF Certificate Rendering & Download (pdf-lib)                       |
|  - Protected Admin Operations Dashboard (/admin)                        |
+------------------------------------+------------------------------------+
                                     |
                         HTTPS / WSS | Convex React Client
                                     v
+------------------------------------+------------------------------------+
|                         CONVEX CLOUD BACKEND                            |
|                                                                         |
|  [Schema & Documents]                                                   |
|   - events (draft, published, registration_closed, completed, etc.)     |
|   - registrations (synced from Google Forms / Sheets)                   |
|   - certificates (verified records, credential numbers, hashes)         |
|   - admin_users (usernames, hashed passwords, roles)                    |
|   - admin_sessions (token hashes, expiry, active status)                |
|   - audit_logs (traceability for admin actions and sync events)         |
|                                                                         |
|  [Server Functions]                                                     |
|   - Queries: getPublishedEvents, getEventBySlug, verifyCertificate      |
|   - Mutations: createEvent, updateEvent, toggleRegistration, issueCert  |
|   - Actions: syncWithGoogleAppsScript, notifyAppsScriptNewEvent         |
|   - HTTP Actions: /api/google-webhook (receives sync from Apps Script)  |
+------------------------------------+------------------------------------+
                                     |
                       HTTPS Requests| Server-to-Server (API_KEY)
                                     v
+------------------------------------+------------------------------------+
|               GOOGLE APPS SCRIPT AUTOMATION BACKEND                     |
|  - Handles Google Drive FormApp.create()                                |
|  - Auto-configures questions (Roll No, Name, Branch, etc.)              |
|  - Binds Form responses to destination Google Spreadsheet               |
|  - Google Sheets Tabs: Events, FormRegistry, Registrations, AuditLog     |
|  - Synchronizes attendee submissions into Convex                        |
+-------------------------------------------------------------------------+
```

---

## 2. Security Boundaries & Zero-Trust Principles

### 2.1 Public vs. Privileged Separation
- **Public Frontend (`src/`):** Contains zero private secrets. The only client-exposed environment variable is `VITE_CONVEX_URL` and `VITE_SITE_URL`.
- **Private Backend (`convex/`):** Privileged secrets (`GOOGLE_APPS_SCRIPT_URL`, `GOOGLE_APPS_SCRIPT_API_KEY`, `ADMIN_SECRET_KEY`) reside exclusively in Convex environment variables or trusted server actions.
- **Google Apps Script (`Code.gs`):** Validates the incoming shared secret `apiKey` on every privileged POST action.

### 2.2 Role-Based Access Control (RBAC)
- `super_admin`: Full system control, user creation, event deletion, credential configuration.
- `admin`: Event creation, editing, publishing, registration toggle, certificate generation.
- `editor`: Draft event creation, preview, and submission.

### 2.3 Registration Integrity
- Students register via **real Google Forms**, preserving anti-spam protections and official institutional records in Google Drive.
- Convex stores synced registration metadata for attendance verification and certificate eligibility.
- Certificates are generated strictly from recorded attendance or verified registrations.

---

## 3. Data Flow & Synchronization

### 3.1 Event Creation & Form Generation Flow
1. Administrator creates event in `/admin`.
2. Convex mutation saves event record with status `draft`.
3. Administrator reviews preview and clicks "Publish & Generate Form".
4. Convex server action `createEventWithGoogleForm` dispatches an authenticated HTTPS POST to the Google Apps Script Web App.
5. Apps Script invokes `FormApp.create()`, applies title, description, and question items, binds responses to the Google Sheet, and returns the real public Form URL (`publishedUrl`) and Form ID.
6. Convex updates the event record with `formUrl`, `formId`, and status `published`.
7. The public event card and details page immediately display the authentic registration link.

### 3.2 Certificate Issuance & Verification Flow
1. Administrator uploads or selects attendee list from synced registrations.
2. Convex mutation issues a certificate with a unique deterministic credential ID (e.g., `EDAM-2026-XXXX`).
3. Student receives credential link (e.g., `https://edam-iare.web.app/verify/EDAM-2026-XXXX`).
4. Any employer or student visiting `/verify/EDAM-2026-XXXX` triggers `verifyCertificate` query in Convex.
5. Client-side PDF engine (`pdf-lib`) renders the certificate with the official e-DAM seal, vector badges, signatories, and scannable QR verification code.
