# Vercel Deployment & Production Runbook
**Project:** e-DAM IARE  
**Hosting Environment:** Vercel (Edge Network + Serverless Functions)  

---

## 1. Project Configuration

The project builds as a Vite Single Page Application with serverless functions natively served from the `/api` directory:

```json
{
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

- **Build Command:** `npm run build` (`tsc -b && vite build`)
- **Output Directory:** `dist`
- **Node.js Version:** `20.x` or `22.x`

---

## 2. Environment Variables Checklist in Vercel Dashboard

Navigate to **Project Settings -> Environment Variables** in your Vercel Dashboard and configure:

| Variable Name | Required Scope | Description / Sample Value |
|---|---|---|
| `DATABASE_URL` | Production, Preview | Pooled Neon PostgreSQL connection string (`postgresql://<user>:<password>@<ep-pooler>...`) |
| `DIRECT_URL` | Production, Preview | Direct compute Neon PostgreSQL connection string (`postgresql://<user>:<password>@<ep>...`) |
| `R2_ACCOUNT_ID` | Production, Preview | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | Production, Preview | Cloudflare R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | Production, Preview | Cloudflare R2 Secret Access Key |
| `R2_BUCKET_NAME` | Production, Preview | `edam-iare-media` |
| `R2_ENDPOINT` | Production, Preview | `https://<account_id>.r2.cloudflarestorage.com` |
| `GOOGLE_APPS_SCRIPT_URL` | Production, Preview | `https://script.google.com/macros/s/<deployment_id>/exec` |
| `GOOGLE_APPS_SCRIPT_SECRET` | Production, Preview | `edam_iare_apps_script_key_2026` |
| `GOOGLE_SPREADSHEET_ID` | Production, Preview | Google Spreadsheet ID |
| `ADMIN_INITIAL_PASSWORD` | Production, Preview | Initial password for admin provisioning |
| `VITE_GOOGLE_APPS_SCRIPT_URL` | Production, Preview | `https://script.google.com/macros/s/<deployment_id>/exec` |
| `VITE_GOOGLE_APPS_SCRIPT_API_KEY` | Production, Preview | `edam_iare_apps_script_key_2026` |

---

## 3. Pre-Flight Verification Commands

Run locally before pushing to git:

```bash
# 1. Verify TypeScript types
npm run build

# 2. Run Database Migrations to Neon
npm run db:migrate

# 3. Check live health endpoint
curl http://localhost:5173/api/health
```

