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
        return json;
      }

      return {
        success: response.ok,
        status: response.status,
      };
    } catch (err: unknown) {
      console.warn(`[ApiClient] Request to ${endpoint} failed:`, err);
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
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
    return this.request(`/api/events/${slug}`);
  }

  static async createEvent(eventData: any) {
    return this.request("/api/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  }

  static async updateEvent(slugOrId: string, eventData: any) {
    return this.request(`/api/events/${slugOrId}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    });
  }

  static async deleteEvent(slugOrId: string) {
    return this.request(`/api/events/${slugOrId}`, {
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

  static async verifyCertificate(certNumber: string) {
    return this.request(`/api/certificates/verify/${encodeURIComponent(certNumber)}`);
  }

  // --- GOOGLE INTEGRATIONS ---
  static async createGoogleForm(eventId: string) {
    return this.request("/api/integrations/google/create-form", {
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
    contentType: string;
  }) {
    return this.request("/api/uploads/presigned-url", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}
