# External Cleanup Checklist & Residual Decommissioning
**Target:** e-DAM IARE  
**Status:** Verification & Maintenance  

---

## 1. Local Codebase Cleanup Completed

- [x] **Convex Directory Removed:** `e-Dam-IARE/convex/` has been safely deleted.
- [x] **Convex NPM Dependency Removed:** Uninstalled from `package.json`.
- [x] **Convex Text References Updated:** `AdminFooter.tsx`, `edam-data.ts`, and `PrivacyPage.tsx` updated to reflect Neon PostgreSQL + Cloudflare R2.
- [x] **Legacy Root Folder `@/` Removed:** Deleted stray root directory from prior turns.
- [x] **Legacy ACM Components Cleaned:** Confirmed no residual ACM imports in `src/`.
- [x] **Vercel Functions Configured:** `/api` endpoints activated with `vercel.json` rewrites.

---

## 2. Cloud & Third-Party Cleanup Checklist

### A. Convex Dashboard (External)
If a temporary Convex project was created during initial prototyping:
1. Log into [dashboard.convex.dev](https://dashboard.convex.dev).
2. Locate any orphan project named `e-dam-iare` or similar.
3. In Project Settings, click **Delete Project**. *(No user data exists in Convex)*.

### B. Cloudflare R2 Bucket
1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) -> R2 Storage.
2. Verify bucket `edam-iare-media` exists and permissions are active.
3. Confirm bucket remains **Private** (do not enable public bucket URL unless desired; all access is handled through short-lived presigned URLs).

### C. Neon PostgreSQL
1. Open [console.neon.tech](https://console.neon.tech).
2. Confirm database project `neondb` has tables created:
   - `chapter_events`
   - `event_registrations`
   - `certificate_templates`
   - `issued_certificates`
   - `admin_users`
   - `admin_sessions`
   - `file_metadata`
   - `audit_logs`
3. Connection pooling is enabled via `ep-...-pooler.c-4.ap-southeast-1.aws.neon.tech`.

### D. Google Workspace & Apps Script
1. Open the connected Google Sheet (`1lYf5A0G3fAIp_K-zT1IDZ1dEro0bEAWJWdmPRIcYW4U`).
2. Run `setupAll` once from Apps Script editor to create required tabs and trigger.
3. Verify Web App Deployment access is set to **"Anyone"**.

