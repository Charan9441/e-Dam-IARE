# Project Audit — e-DAM IARE

**Organization:** e-DAM — e-Designing and Marketing, IARE  
**Institution:** Institute of Aeronautical Engineering (IARE), Hyderabad  
**Frontend Reference Repository:** [Charan9441/e-Dam-IARE](https://github.com/Charan9441/e-Dam-IARE)  
**Audit Date:** October 2026  
**Auditor:** Antigravity Senior Full-Stack Engineering & QA Team  

---

## 1. Executive Summary

This audit assesses the state of the e-DAM IARE digital platform codebase, evaluates its existing capabilities, identifies architectural gaps, and defines the roadmap to transform the project into a secure, production-grade community platform powered by **React 19 + Vite + TypeScript + Tailwind CSS** on the frontend, and **Convex** on the backend, alongside an integrated **Google Apps Script / Google Forms / Google Sheets** automation pipeline.

---

## 2. Codebase & Environment Inventory

### 2.1 Directory Structure & Repositories
The workspace contains:
1. `e-Dam-IARE/` — The primary frontend repository (`git remote: https://github.com/Charan9441/e-Dam-IARE`).
2. `e-Dam-IARE-vite-backup/` — An intact pre-audit backup snapshot.
3. `ACM-IARE/` — A reference sister project containing the prior Google Apps Script automation engine (`google-apps-script/Code.gs`), PostgreSQL (Neon) schemas, certificate generators, and administrative patterns.

### 2.2 Frontend Stack (`e-Dam-IARE/package.json`)
- **Runtime & Bundler:** Vite 8.2.0, Node.js environment
- **Framework:** React 19.2.8 + React DOM 19.2.8
- **Language:** TypeScript 6.0.2 with `"moduleResolution": "bundler"`, `"target": "es2023"`
- **Styling:** Tailwind CSS 3.4.19, `tailwindcss-animate`, PostCSS 8.5.26, Autoprefixer 10.5.4
- **Animation & Motion:** `motion` (v13.1.0), `animejs` (v4.5.0)
- **Data Visualization & Metrics:** `@visx/*` (curve, event, gradient, grid, responsive, scale, shape), `d3-array`, `d3-shape`, `@number-flow/react`
- **Iconography:** `lucide-react` (v1.31.0), `react-icons` (v5.7.0)
- **Code Quality:** Oxlint (v1.75.0)

---

## 3. Brand Identity & Visual Assets

### 3.1 Official Colors & Tokens
- **Background Main:** `#030305` (Deep space black)
- **Surface / Cards:** `#0B0614` / `#101014` (Dark violet-tinted obsidian)
- **Elevated Surface:** `#18181F`
- **Primary Purple:** `#8B5CF6` (Vibrant electric violet)
- **Bright Purple:** `#A855F7`
- **Deep Purple:** `#5B21B6`
- **Lavender Accent:** `#C4B5FD`
- **Magenta / Neon Accent:** `#C026FF` / `#C026D3`
- **Text Main:** `#F5F3FF`
- **Text Muted:** `#928A9F`

### 3.2 Typography
- **Primary Body / UI:** `Space Grotesk` (Google Font, sans-serif)
- **Headings & Accents:** `Fraunces` (Google Font, serif/editorial italic)

### 3.3 Visual Assets Verified
- `src/assets/edam-logo.jpg`: Authentic e-DAM emblem.
- `src/assets/hero.png`: Brand imagery.

### 3.4 Community Identity & Core Pillars
- **Identity:** Learn, Network, Grow
- **Technical Domains:**
  1. UI/UX Design & Creative Art
  2. Cybersecurity & System Integrity
  3. Data Science & Big Data Analytics
  4. Full-Stack Web & Mobile Development
  5. Artificial Intelligence & Machine Learning
- **Signature Initiative:** 100 Days of Tech
- **Official Links:**
  - LinkedIn: `https://in.linkedin.com/company/edamcommunity`
  - Instagram: `https://www.instagram.com/edam.iare/`
  - IARE Official Portal: `https://iare.ac.in/`

---

## 4. Assessment of Existing Capabilities

| Feature Area | Current State in Reference | Target Production State | Gap / Action Required |
|---|---|---|---|
| **Landing Page** | Working, high visual fidelity | Retain and enrich with live feeds | Link live events from Convex |
| **Routing** | Single-page scroll `#about`, `#events` | Client-side routing with React Router | Implement `/events`, `/events/:slug`, `/initiatives`, `/verify`, `/admin` |
| **Event System** | Static in-memory mock array | Dynamic Convex database collection | Schema with draft/published status, Google Form link |
| **Registration Flow** | Mock button `#join` | Real Google Form integration | Direct attendees to authentic Google Form |
| **Google Apps Script** | Sibling `ACM-IARE` script exists | Adapt for e-DAM (`google-apps-script/Code.gs`) | Connect Convex server actions to Apps Script API |
| **Authentication** | None | Secure admin role-based auth | Convex session management + SHA-256 tokens |
| **Certificate Verification** | None in `e-Dam-IARE` | Full verification portal & PDF engine | QR-code verified PDF engine with `pdf-lib` + `/verify/:id` |
| **Database** | None (Previously Neon in sibling) | Convex Document Database | Clean TypeScript schema in `convex/schema.ts` |
| **Data Privacy** | Incomplete footer links | Privacy policy & student data disclosure | Dedicated `/privacy` and `/terms` routes |

---

## 5. Google Apps Script & Forms Integration Audit

The script in `ACM-IARE/google-apps-script/Code.gs` provides 1,169 lines of Google Apps Script logic:
1. **HTTP Dispatcher:** `doPost(e)` and `doGet(e)` protected by a shared secret `API_KEY`.
2. **Sheet Management:** Auto-initializes 5 tabs: `Events`, `FormRegistry`, `Registrations`, `AuditLog`, `FormConfigurations`.
3. **Google Form Automation:** Calls `FormApp.create()`, configures titles, descriptions, and custom questions, enables response collection, links response destination to Google Sheets, and returns public URLs.
4. **Idempotency:** Checks for existing `eventId` before creating duplicates.
5. **Convex Migration Plan:** Convex backend actions will securely call the Apps Script deployment endpoint over HTTPS using the shared secret stored in server-side environment variables.

---

## 6. Compatibility & Architecture Decision

- **Framework Preservation:** Retain React 19 + Vite + Tailwind CSS.
- **Backend Selection:** Convex document database. No Neon, no Railway, no Supabase.
- **Routing:** Add `react-router-dom` for multi-page support while keeping smooth section navigation on the home page.
- **Security:** Strict separation of client environment variables (`VITE_*`) from privileged credentials (kept in Convex secrets).
