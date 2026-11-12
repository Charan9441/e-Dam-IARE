import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates that an external link uses an explicit http: or https: scheme.
 * Blocks javascript:, data:, vbscript:, and relative path injection in external links.
 */
export function safeExternalHttpUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Prevents CSV/spreadsheet formula injection (=, +, -, @, tab, CR) and applies RFC 4180 quoting.
 */
export function sanitizeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const normalized = raw.replace(/\r?\n/g, " ");
  const safe = /^[=+\-@\t\r]/.test(normalized) ? `'${normalized}` : normalized;
  return `"${safe.replace(/"/g, '""')}"`;
}
