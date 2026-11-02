/**
 * Role-Based Access Control (RBAC) Definition & Enforcement
 * System: e-DAM IARE
 */

import type { AdminRole } from "../db/schema";

export type Permission =
  | "events:view"
  | "events:create"
  | "events:edit"
  | "events:delete"
  | "registrations:view"
  | "registrations:manage"
  | "certificates:view"
  | "certificates:issue"
  | "certificates:revoke"
  | "uploads:manage"
  | "google:integrations"
  | "users:manage"
  | "audit:view";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [
    "events:view",
    "events:create",
    "events:edit",
    "events:delete",
    "registrations:view",
    "registrations:manage",
    "certificates:view",
    "certificates:issue",
    "certificates:revoke",
    "uploads:manage",
    "google:integrations",
    "users:manage",
    "audit:view",
  ],
  ADMIN: [
    "events:view",
    "events:create",
    "events:edit",
    "events:delete",
    "registrations:view",
    "registrations:manage",
    "certificates:view",
    "certificates:issue",
    "certificates:revoke",
    "uploads:manage",
    "google:integrations",
  ],
  EDITOR: [
    "events:view",
    "events:edit",
    "registrations:view",
    "certificates:view",
    "uploads:manage",
  ],
  VIEWER: [
    "events:view",
    "registrations:view",
    "certificates:view",
  ],
};

/**
 * Normalizes any legacy or case-variant role into strict AdminRole
 */
export function normalizeRole(roleString?: string | null): AdminRole {
  if (!roleString) return "VIEWER";
  const r = roleString.toUpperCase().trim();
  if (r === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (r === "ADMIN") return "ADMIN";
  if (r === "EDITOR") return "EDITOR";
  return "VIEWER";
}

/**
 * Verifies if a given role possesses the required permission
 */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Returns all permissions associated with a role
 */
export function getRolePermissions(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

