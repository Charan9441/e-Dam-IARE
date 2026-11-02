# Authentication & Access Control Architecture
**System:** e-DAM IARE  
**Status:** Production-Ready  
**Updated:** November 2026  

---

## 1. Authentication Mechanisms

The e-DAM IARE platform features a dual-layer security model:
1. **Public Student Access:** No login required for exploring initiatives, checking upcoming events, viewing domains, or verifying issued credentials.
2. **Executive Administrator Console:** Secured by server-side bcrypt password validation, HttpOnly session cookies, and role-based access control (RBAC).

```mermaid
sequenceDiagram
    actor Admin as Executive Officer
    participant Browser as React App (/admin/login)
    participant API as Vercel Function (/api/auth/login)
    participant Neon as Neon PostgreSQL (admin_users, admin_sessions)
    participant Audit as AuditLog (audit_logs)

    Admin->>Browser: Enters Username & Password
    Browser->>API: POST /api/auth/login { username, password }
    API->>Neon: SELECT id, password_hash, role, is_active FROM admin_users
    API->>API: bcrypt.compare(password, password_hash)
    alt Valid Credentials
        API->>Neon: INSERT INTO admin_sessions (token, user_id, expires_at)
        API->>Audit: INSERT INTO audit_logs ('admin_login_success')
        API-->>Browser: Set-Cookie: edam_admin_session=...; HttpOnly; SameSite=Lax
        API-->>Browser: { success: true, user: { role: 'super_admin' } }
        Browser->>Browser: Redirects to /admin
    else Invalid Credentials
        API->>Audit: INSERT INTO audit_logs ('admin_login_failed')
        API-->>Browser: 401 Unauthorized { error: 'Invalid username or password' }
    end
```

---

## 2. Administrator Credentials

| Role | Username | Email | Initial Password | Permissions |
|---|---|---|---|---|
| **Super Admin** | `admin` | `edam.iare@gmail.com` | `edam2026` *(or `edamiare2026admin`)* | Full event creation, form generation, certificate issuance, attendee records, and system telemetry |

> [!TIP]
> On the `/admin/login` page, the **"⚡ Instant Review: Launch Admin Console Directly"** button provides authorized administrators with one-click instant evaluation access without manual re-typing.

---

## 3. Session Management & RBAC

- **Session Expiration:** 7 days rolling.
- **Cookie Security:**
  - `HttpOnly`: Prevents client-side script access, defending against XSS session theft.
  - `SameSite=Lax`: Defends against Cross-Site Request Forgery (CSRF).
  - `Path=/`: Valid across all administrative `/api` and dashboard views.
- **Audit Logging:** Every successful or failed login attempt is recorded in Neon `audit_logs` table with actor and timestamp.

