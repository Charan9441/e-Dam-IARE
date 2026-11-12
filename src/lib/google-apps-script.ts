/**
 * Google Apps Script Server-Proxied Client Interface
 * All Google Apps Script / Workspace requests are routed exclusively through
 * authenticated Vercel API endpoints (/api/integrations/google/*) so that
 * secrets, webhook keys, and spreadsheet IDs never enter the browser bundle.
 */

import { ApiClient } from "./api-client";

export interface CreateFormResponse {
  success: boolean;
  formUrl?: string;
  formId?: string;
  formEditUrl?: string;
  error?: string;
}

export interface SyncRegistrationsResponse {
  success: boolean;
  syncedCount?: number;
  registrations?: Array<{
    registrationId?: string;
    id?: string;
    attendeeName?: string;
    name?: string;
    email?: string;
    phone?: string;
    rollNumber?: string;
    department?: string;
    yearOfStudy?: string;
    submittedAt?: string;
  }>;
  error?: string;
}

/**
 * Provisions a Google Form linked to Google Sheets via the authenticated backend proxy
 */
export async function createGoogleFormViaAppsScript(params: {
  eventId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  registrationOpen: boolean;
}): Promise<CreateFormResponse> {
  const res = await ApiClient.createGoogleForm(params);
  if (res.success && res.form) {
    return {
      success: true,
      formUrl: res.form.responderUrl,
      formId: res.form.formId,
      formEditUrl: res.form.editUrl,
    };
  }
  return {
    success: false,
    error: res.error || "Failed to provision Google Form via server proxy.",
  };
}

/**
 * Toggles form response collection via the authenticated backend proxy
 */
export async function toggleFormViaAppsScript(
  eventId: string,
  open: boolean
): Promise<{ success: boolean; error?: string }> {
  const res = await ApiClient.toggleGoogleForm(eventId, open);
  return {
    success: Boolean(res.success),
    error: res.error,
  };
}

/**
 * Pulls latest registrations from Google Sheets via the authenticated backend proxy
 */
export async function syncRegistrationsViaAppsScript(
  eventId: string
): Promise<SyncRegistrationsResponse> {
  const res = await ApiClient.syncGoogleRegistrations(eventId);
  return {
    success: Boolean(res.success),
    syncedCount: res.syncedCount,
    registrations: res.registrations,
    error: res.error,
  };
}
