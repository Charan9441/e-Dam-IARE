# Old Integrations Audit & Status Report
**Project:** e-DAM IARE (Design, Architecture & Multidisciplinary Student Body)  
**Date:** November 2026  
**Auditor:** Lead Systems Architect & Full-Stack Security Engineer  

---

## Executive Summary
Prior to executing the final infrastructure migration for the official **e-DAM IARE** platform, a comprehensive audit of the entire codebase was conducted to identify active, partial, mock, obsolete, and target integrations.

---

## 1. Inventory of Existing & Legacy Integrations

| Integration | Audit Classification | Location in Codebase | Assessment & Migration Action |
|---|---|---|---|
| **Convex** | **Partially Implemented / Unconnected to Frontend** | `convex/` (`schema.ts`, `events.ts`, `certificates.ts`, etc.), `package.json` (`convex: ^1.48.0`) | Scaffolding was created, but `src/` never imported `ConvexProvider`, `useQuery`, or `useMutation`. Zero production user data stored. **Action:** Safely remove `convex` package and `convex/` directory once Neon schema is active. |
| **Supabase** | **Unused / None** | None | No code or package references exist. **Action:** Confirm omitted in target architecture. |
| **Railway** | **Unused / None** | None | No code or deployment configurations exist. **Action:** Confirm omitted in target architecture. |
| **Neon PostgreSQL** | **Target Production Database** | Previously in `ACM-IARE/src/lib/db.ts`; now being activated in `e-Dam-IARE/src/server/db/` | Provided connection pooler and direct connection URLs: `DATABASE_URL` and `DIRECT_URL`. Schema will support events, registrations, certificates, users, audit logs, and storage metadata via Drizzle ORM. |
| **Cloudflare R2** | **Target Production Object Storage** | `e-Dam-IARE/src/server/storage/` | Private S3-compatible bucket `edam-iare-media`. Used for banners, certificate PDFs, and assets via AWS SDK presigned URLs. |
| **Google Apps Script** | **Active & Production Connected** | `google-apps-script/Code.gs`, `src/lib/google-apps-script.ts` | Deployed Web App: `AKfycby23I_LrQVv-Ia2S4-mSUB5f1PDRmhSrZNFmLcLKdXnj2NiYmwWNbsD2cbuibfEZ8V8`. Handles automatic Google Form generation and Google Sheet synchronization. |
| **Google Sheets & Forms** | **Active & Production Connected** | Spreadsheet ID `1lYf5A0G3fAIp_K-zT1IDZ1dEro0bEAWJWdmPRIcYW4U` | Target spreadsheet storing registration data. Form-submit triggers post data to the Vercel webhook endpoint. |
| **Admin Authentication** | **Active (Client Session) -> Upgrading to Server-Side** | `src/pages/admin/AdminLoginPage.tsx`, `src/lib/edam-store.ts` | Credentials: `admin` / `edam2026`. Upgrading to secure server-side bcrypt-backed API route `/api/auth/login`. |

---

## 2. Detailed Findings

### A. Convex Audit
- **Files Inspected:** `convex/schema.ts`, `convex/events.ts`, `convex/auth.ts`, `convex/googleAppsScript.ts`, `convex/http.ts`.
- **Frontend Usage:** Grep across `src/` confirms **zero** imports of `@convex-dev` or `convex/react`. The UI components exclusively interact with `src/lib/edam-store.ts` (which utilizes in-memory seed data with `localStorage` persistence).
- **Data Integrity Risk:** None. The Convex project was never connected to an active production database deployment holding student records. Removing Convex will not cause any data loss.

### B. Neon PostgreSQL Audit
- **Configuration:**
  - `DATABASE_URL`: Connection string with connection pooler enabled (`ep-dawn-pine-b3auwo5k-pooler.c-4.ap-southeast-1.aws.neon.tech`).
  - `DIRECT_URL`: Direct compute connection string for schema migrations (`ep-dawn-pine-b3auwo5k.c-4.ap-southeast-1.aws.neon.tech`).
- **Target Schema:** Drizzle ORM definitions will map `chapter_events`, `event_registrations`, `issued_certificates`, `certificate_templates`, `admin_users`, `admin_sessions`, `file_metadata`, and `audit_logs`.

### C. Cloudflare R2 Audit
- **Bucket:** `edam-iare-media`
- **Endpoint:** `https://88b6fb99664573db55eb9f1efca3c09b.r2.cloudflarestorage.com`
- **Security:** Private bucket access only. Client gets short-lived (15 min) presigned URLs for direct upload/download, keeping credentials strictly server-side.

### D. Google Apps Script Audit
- **Source:** `google-apps-script/Code.gs` is deployed as a Google Apps Script Web App.
- **Actions:**
  - `ping`: Health check.
  - `createEventForm`: Creates Google Form, attaches it to the master Google Sheet, adds standard registration fields (Full Name, Roll Number, Email, Department, Year, Phone), and returns the responder and edit URLs.
  - `syncFormResponses`: Extracts sheet rows and returns structured registration objects.
  - `onFormSubmitTrigger`: Installable trigger that posts to `/api/integrations/google/webhook`.

---

## 3. Migration Recommendation & Deletion Clearance
1. **Convex:** Safe for immediate deletion after Neon + Vercel Functions are in place.
2. **ACM Components:** Any remaining legacy ACM branding or components have been cleaned from `e-Dam-IARE/src/components`. Reference code in `ACM-IARE` will be cleaned up per user instructions.

