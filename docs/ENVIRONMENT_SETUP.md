# Environment Setup & Secrets Configuration
**Project:** e-DAM IARE  

---

## 1. Local Configuration File (`.env.local`)

Place the following in `d:\e-DAM IARE\e-Dam-IARE\.env.local`:

```env
# ==============================================================================
# DATABASE (Neon Serverless PostgreSQL)
# ==============================================================================
DATABASE_URL="postgresql://<user>:<password>@<ep-pooler-id>.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://<user>:<password>@<ep-direct-id>.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# ==============================================================================
# OBJECT STORAGE (Cloudflare R2 - S3 Compatible)
# ==============================================================================
R2_ACCOUNT_ID=<your_cloudflare_account_id>
R2_ACCESS_KEY_ID=<your_r2_access_key_id>
R2_SECRET_ACCESS_KEY=<your_r2_secret_access_key>
R2_BUCKET_NAME=edam-iare-media
R2_ENDPOINT=https://<your_account_id>.r2.cloudflarestorage.com

# ==============================================================================
# GOOGLE WORKSPACE & APPS SCRIPT AUTOMATION
# ==============================================================================
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/<deployment_id>/exec
GOOGLE_APPS_SCRIPT_SECRET=edam_iare_apps_script_key_2026
GOOGLE_SPREADSHEET_ID=<spreadsheet_id>

# Frontend Public Mirrors (Vite)
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/<deployment_id>/exec
VITE_GOOGLE_APPS_SCRIPT_DEPLOYMENT_ID=<deployment_id>
VITE_GOOGLE_APPS_SCRIPT_API_KEY=edam_iare_apps_script_key_2026

# ==============================================================================
# ADMIN AUTHENTICATION
# ==============================================================================
ADMIN_INITIAL_PASSWORD=edam2026
```
