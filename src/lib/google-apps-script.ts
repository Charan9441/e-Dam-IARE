/**
 * Google Apps Script Web App Client Interface
 * Talks directly to the deployed Google Apps Script Web App for e-DAM IARE.
 */

const APPS_SCRIPT_URL =
  import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycby23I_LrQVv-Ia2S4-mSUB5f1PDRmhSrZNFmLcLKdXnj2NiYmwWNbsD2cbuibfEZ8V8/exec";

const API_KEY =
  import.meta.env.VITE_GOOGLE_APPS_SCRIPT_API_KEY ||
  "edam_iare_apps_script_key_2026";

export interface CreateFormResponse {
  success: boolean;
  formUrl?: string;
  formId?: string;
  formEditUrl?: string;
  error?: string;
}

export interface SyncRegistrationsResponse {
  success: boolean;
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
 * Automatically creates a Google Form linked to Google Sheets via Apps Script
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
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_event",
        apiKey: API_KEY,
        payload: {
          id: params.eventId,
          title: params.title,
          description: params.description,
          date: params.date,
          time: params.time,
          venue: params.venue,
          registrationOpen: params.registrationOpen,
        },
      }),
    });

    const data = await response.json();
    return data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Toggles form response collection via Apps Script
 */
export async function toggleFormViaAppsScript(
  eventId: string,
  open: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_registration",
        apiKey: API_KEY,
        payload: { id: eventId, open },
      }),
    });
    const data = await response.json();
    return data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Pulls latest registrations from the Google Sheet
 */
export async function syncRegistrationsViaAppsScript(
  eventId: string
): Promise<SyncRegistrationsResponse> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sync_registrations",
        apiKey: API_KEY,
        payload: { eventId },
      }),
    });
    const data = await response.json();
    return data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

