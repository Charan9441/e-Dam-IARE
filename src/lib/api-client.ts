/**
 * e-DAM IARE API Client
 * Centralized service communicating with Vercel Functions (/api/*)
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

export class ApiClient {
  private static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        credentials: "include", // Essential for HttpOnly session cookies
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        return {
          ...json,
          status: response.status,
          success: typeof json.success === "boolean" ? json.success : response.ok,
        };
      }

      return {
        success: response.ok,
        status: response.status,
        error: response.ok ? undefined : "Request failed with an unexpected server response.",
      };
    } catch (err: unknown) {
      console.warn(`[ApiClient] Request to ${endpoint} failed:`, err);
      return {
        success: false,
        error: "Unable to communicate with the server. Please try again.",
      };
    }
  }

  // --- HEALTH ---
  static async getHealth() {
    return this.request("/api/health");
  }

  // --- EVENTS ---
  static async getEvents(params?: { status?: string; category?: string }) {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.category) search.set("category", params.category);
    const query = search.toString() ? `?${search.toString()}` : "";
    return this.request(`/api/events${query}`);
  }

  static async getEventBySlug(slug: string) {
    return this.request(`/api/events/${encodeURIComponent(slug)}`);
  }

  static async createEvent(eventData: any) {
    return this.request("/api/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  }

  static async updateEvent(slugOrId: string, eventData: any) {
    return this.request(`/api/events/${encodeURIComponent(slugOrId)}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    });
  }

  static async deleteEvent(slugOrId: string) {
    return this.request(`/api/events/${encodeURIComponent(slugOrId)}`, {
      method: "DELETE",
    });
  }

  // --- REGISTRATIONS ---
  static async getRegistrations(eventId?: string) {
    const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : "";
    return this.request(`/api/registrations${query}`);
  }

  static async submitRegistration(registration: any) {
    return this.request("/api/registrations", {
      method: "POST",
      body: JSON.stringify(registration),
    });
  }

  // --- CERTIFICATES ---
  static async getCertificates(eventId?: string) {
    const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : "";
    return this.request(`/api/certificates${query}`);
  }

  static async issueCertificate(certificateData: any) {
    return this.request("/api/certificates", {
      method: "POST",
      body: JSON.stringify(certificateData),
    });
  }

  static async updateCertificateStatus(certIdOrNumber: string, status: "valid" | "revoked", reason?: string) {
    return this.request("/api/certificates", {
      method: "PUT",
      body: JSON.stringify({ certificateNumber: certIdOrNumber, status, revokedReason: reason }),
    });
  }

  static async verifyCertificate(certNumber: string) {
    return this.request(`/api/certificates/verify/${encodeURIComponent(certNumber)}`);
  }

  // --- GOOGLE INTEGRATIONS (Server-Proxied, Admin Authenticated) ---
  static async createGoogleForm(payload: {
    eventId: string;
    title?: string;
    description?: string;
    date?: string;
    time?: string;
    venue?: string;
    registrationOpen?: boolean;
  }) {
    return this.request("/api/integrations/google/create-form", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async toggleGoogleForm(eventId: string, open: boolean) {
    return this.request("/api/integrations/google/toggle-registration", {
      method: "POST",
      body: JSON.stringify({ eventId, open }),
    });
  }

  static async syncGoogleRegistrations(eventId: string) {
    return this.request("/api/integrations/google/sync-registrations", {
      method: "POST",
      body: JSON.stringify({ eventId }),
    });
  }

  // --- AUTH ---
  static async login(credentials: { username: string; password: string }) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  static async logout() {
    return this.request("/api/auth/logout", {
      method: "POST",
    });
  }

  static async getMe() {
    return this.request("/api/auth/me");
  }

  // --- AUDIT & USERS ---
  static async getAuditLogs(limit = 100) {
    return this.request(`/api/admin/audit-logs?limit=${limit}`);
  }

  static async getUsers() {
    return this.request("/api/admin/users");
  }

  // --- UPLOADS ---
  static async getPresignedUploadUrl(data: {
    category: "banners" | "certificates" | "media" | "documents";
    filename: string;
    contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
    fileSizeBytes: number;
  }) {
    return this.request("/api/uploads/presigned-url", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}
