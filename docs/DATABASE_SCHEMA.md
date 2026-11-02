# Database Schema Documentation: Neon PostgreSQL
**System:** e-DAM IARE Production Database  
**Provider:** Neon Serverless PostgreSQL  
**Host:** AWS ap-southeast-1  

---

## Entity Relationship Overview

```mermaid
erDiagram
    CHAPTER_EVENTS ||--o{ EVENT_REGISTRATIONS : "has"
    CHAPTER_EVENTS ||--o{ ISSUED_CERTIFICATES : "generates"
    CERTIFICATE_TEMPLATES ||--o{ ISSUED_CERTIFICATES : "defines"
    ADMIN_USERS ||--o{ ADMIN_SESSIONS : "owns"
    ADMIN_USERS ||--o{ AUDIT_LOGS : "performs"
    CHAPTER_EVENTS ||--o{ FILE_METADATA : "associates"

    CHAPTER_EVENTS {
        string id PK
        string slug UK
        string title
        string category
        string status
        string date
        string time
        string venue
        string mode
        text description
        jsonb detailed_overview
        jsonb prerequisites
        jsonb takeaways
        jsonb speakers
        string registration_deadline
        boolean registration_open
        text registration_url
        string google_form_id
        text google_form_url
        text google_form_edit_url
        string form_status
        jsonb form_config
        int response_count
        text banner_image
        int capacity
        boolean featured
        boolean is_archived
        timestamp created_at
        timestamp updated_at
    }

    EVENT_REGISTRATIONS {
        string id PK
        string event_id FK
        text event_title
        text full_name
        string email
        string roll_number
        string department
        string year_of_study
        string phone
        jsonb answers
        string sync_source
        timestamp submitted_at
    }

    CERTIFICATE_TEMPLATES {
        string id PK
        string name
        text description
        string type
        text title
        text subtitle
        text body_template
        text issuer_organization
        jsonb signatories
        jsonb branding
        jsonb layout
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    ISSUED_CERTIFICATES {
        string id PK
        string certificate_number UK
        string event_id FK
        string registration_id FK
        string template_id FK
        text recipient_name
        string recipient_email
        string recipient_roll_number
        string recipient_department
        text event_title
        string event_date
        string certificate_type
        string status
        timestamp revoked_at
        text revoked_reason
        text pdf_storage_key
        int pdf_file_size
        text qr_verification_url
        timestamp issued_at
        string issued_by
    }

    ADMIN_USERS {
        string id PK
        string username UK
        string email UK
        text password_hash
        string role
        string full_name
        boolean is_active
        timestamp last_login_at
        timestamp created_at
        timestamp updated_at
    }

    ADMIN_SESSIONS {
        string id PK
        string user_id FK
        string token UK
        timestamp expires_at
        timestamp created_at
    }

    FILE_METADATA {
        string id PK
        string storage_key UK
        string bucket
        text file_name
        string content_type
        int file_size_bytes
        string category
        string entity_type
        string entity_id
        timestamp created_at
    }

    AUDIT_LOGS {
        int id PK
        string action
        string actor
        string entity_id
        string status
        jsonb details
        text error_message
        timestamp created_at
    }
```

---

## Table Schemas & Constraints

### 1. `chapter_events`
Stores all workshops, hackathons, assemblies, and bootcamps.
- **Primary Key:** `id VARCHAR(100)`
- **Unique Key:** `slug VARCHAR(200)`
- **Indexes:** `idx_events_slug`, `idx_events_date`, `idx_events_status`
- **Soft Deletion / Archive:** `is_archived BOOLEAN DEFAULT false`

### 2. `event_registrations`
Participant registration records synchronized from Google Forms or direct entry.
- **Primary Key:** `id VARCHAR(100)`
- **Foreign Key:** `event_id` REFERENCES `chapter_events(id)` ON DELETE CASCADE
- **Indexes:** `idx_reg_event`, `idx_reg_email`, `idx_reg_roll`

### 3. `certificate_templates`
Customizable certificate formatting, colors, and institutional signatories.
- **Primary Key:** `id VARCHAR(100)`
- **Signatories:** JSONB array of objects `{ name, role, title, signatureUrl? }`
- **Layout:** JSONB `{ orientation, primaryColor, accentColor, ribbonText }`

### 4. `issued_certificates`
Official issued credentials with unique cryptographic IDs and QR verification URLs.
- **Primary Key:** `id VARCHAR(100)`
- **Unique Key:** `certificate_number VARCHAR(100)`
- **Foreign Keys:** `event_id`, `registration_id`, `template_id`
- **Storage:** `pdf_storage_key` linking to Cloudflare R2 bucket `edam-iare-media`
- **Verification URL:** `qr_verification_url` points to public verification endpoint `/verify/[certificate_number]`

### 5. `admin_users` & `admin_sessions`
Authentication subsystem with bcrypt password hashing and expiring session tokens.
- **Default Super Admin:** `admin` / `edam.iare@gmail.com`
- **Password:** Hashed with bcrypt (salt rounds: 10)

### 6. `file_metadata`
Central tracking of assets stored in Cloudflare R2.
- **Storage Key:** S3 object path (e.g., `certificates/2026/cert_xyz.pdf`, `banners/cad-summit.png`)
- **Bucket:** `edam-iare-media`

### 7. `audit_logs`
Immutable audit trail recording administrative modifications and system webhooks.

