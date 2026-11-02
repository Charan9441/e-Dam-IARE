/**
 * e-DAM IARE PostgreSQL Schema Types & Definitions
 * Database: Neon Serverless PostgreSQL
 */

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER";

export interface ChapterEvent {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  category: string;
  status: "upcoming" | "live" | "completed" | "cancelled";
  date: string;
  time: string;
  venue: string;
  mode: "offline" | "online" | "hybrid";
  description: string;
  detailed_overview?: string[];
  prerequisites?: string[];
  takeaways?: string[];
  speakers?: Array<{ name: string; role: string; title?: string; avatarUrl?: string }>;
  registration_deadline?: string;
  registration_open: boolean;
  registration_url?: string;
  google_form_id?: string;
  google_form_url?: string;
  google_form_edit_url?: string;
  form_status?: string;
  form_config?: Record<string, unknown>;
  response_count: number;
  banner_image?: string;
  capacity: number;
  featured: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  event_title: string;
  full_name: string;
  email: string;
  roll_number?: string;
  department?: string;
  year_of_study?: string;
  phone?: string;
  answers?: Record<string, unknown>;
  sync_source: "google_forms" | "direct_admin" | "csv_import";
  submitted_at: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  type: "participation" | "winner" | "appreciation" | "excellence";
  title: string;
  subtitle: string;
  body_template: string;
  issuer_organization: string;
  signatories: Array<{ name: string; role: string; title: string; signatureUrl?: string }>;
  branding: { primaryColor?: string; accentColor?: string; ribbonText?: string; logoUrl?: string };
  layout: { orientation?: "landscape" | "portrait"; [key: string]: unknown };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IssuedCertificate {
  id: string;
  certificate_number: string;
  event_id?: string;
  registration_id?: string;
  template_id?: string;
  recipient_name: string;
  recipient_email: string;
  recipient_roll_number?: string;
  recipient_department?: string;
  event_title: string;
  event_date: string;
  certificate_type: string;
  status: "valid" | "revoked";
  revoked_at?: string | null;
  revoked_reason?: string | null;
  pdf_storage_key: string;
  pdf_file_size: number;
  qr_verification_url: string;
  issued_at: string;
  issued_by: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: AdminRole;
  full_name?: string;
  is_active: boolean;
  failed_login_attempts: number;
  locked_until?: string | null;
  last_login_at?: string;
  last_login_ip?: string;
  password_changed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  id: string;
  user_id: string;
  token: string;
  ip_address?: string;
  user_agent?: string;
  last_activity_at: string;
  expires_at: string;
  created_at: string;
}

export interface LoginAttempt {
  id: number;
  identifier: string;
  ip_address: string;
  success: boolean;
  attempted_at: string;
}

export interface FileMetadata {
  id: string;
  storage_key: string;
  bucket: string;
  file_name: string;
  content_type: string;
  file_size_bytes: number;
  category: "banners" | "certificates" | "media" | "documents";
  entity_type?: string;
  entity_id?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  action: string;
  actor: string;
  actor_role?: AdminRole;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  status: "success" | "failure" | "pending";
  details?: Record<string, unknown>;
  error_message?: string;
  created_at: string;
}
