import type { ChapterEvent, IssuedCertificate, EventRegistration } from "@/types";
import { EDAM_EVENTS, DEFAULT_CERTIFICATES } from "@/data/edam-data";
import { generateCertificateNumber } from "./certificate-generator";

const EVENTS_STORAGE_KEY = "edam_events_v1";
const CERTS_STORAGE_KEY = "edam_certificates_v1";
const REGS_STORAGE_KEY = "edam_registrations_v1";

/**
 * Returns all active/published events
 */
export function getStoredEvents(): ChapterEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Could not read events from localStorage", e);
  }
  // Initialize storage with defaults
  saveStoredEvents(EDAM_EVENTS);
  return EDAM_EVENTS;
}

export function saveStoredEvents(events: ChapterEvent[]) {
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.warn("Could not save events to localStorage", e);
  }
}

export function getEventBySlug(slug: string): ChapterEvent | undefined {
  const events = getStoredEvents();
  return events.find((e) => e.slug === slug || e.id === slug);
}

export function addEvent(event: Omit<ChapterEvent, "id">): ChapterEvent {
  const events = getStoredEvents();
  const newEvent: ChapterEvent = {
    ...event,
    id: `edam-evt-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newEvent, ...events];
  saveStoredEvents(updated);
  return newEvent;
}

export function updateEvent(id: string, patch: Partial<ChapterEvent>): ChapterEvent | null {
  const events = getStoredEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;
  const updatedEvent = { ...events[index], ...patch, updatedAt: new Date().toISOString() };
  events[index] = updatedEvent;
  saveStoredEvents(events);
  return updatedEvent;
}

export function deleteEvent(id: string): boolean {
  const events = getStoredEvents();
  const filtered = events.filter((e) => e.id !== id);
  saveStoredEvents(filtered);
  return filtered.length < events.length;
}

/**
 * Certificate Registry
 */
export function getStoredCertificates(): IssuedCertificate[] {
  try {
    const raw = localStorage.getItem(CERTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Could not read certificates from localStorage", e);
  }
  saveStoredCertificates(DEFAULT_CERTIFICATES);
  return DEFAULT_CERTIFICATES;
}

export function saveStoredCertificates(certs: IssuedCertificate[]) {
  try {
    localStorage.setItem(CERTS_STORAGE_KEY, JSON.stringify(certs));
  } catch (e) {
    console.warn("Could not save certs to localStorage", e);
  }
}

export function findCertificateById(certNumberOrId: string): IssuedCertificate | undefined {
  const certs = getStoredCertificates();
  const query = certNumberOrId.trim().toUpperCase();
  return certs.find(
    (c) =>
      c.certificateNumber.toUpperCase() === query ||
      c.id.toUpperCase() === query ||
      c.verificationCode.toUpperCase() === query
  );
}

export function issueNewCertificate(data: {
  recipientName: string;
  recipientEmail: string;
  recipientRollNumber?: string;
  recipientDepartment?: string;
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  certificateType: IssuedCertificate["certificateType"];
}): IssuedCertificate {
  const certs = getStoredCertificates();
  const certNumber = generateCertificateNumber();
  const newCert: IssuedCertificate = {
    id: `cert-${Date.now().toString(36)}`,
    certificateNumber: certNumber,
    recipientName: data.recipientName,
    recipientEmail: data.recipientEmail,
    recipientRollNumber: data.recipientRollNumber,
    recipientDepartment: data.recipientDepartment,
    eventId: data.eventId,
    eventTitle: data.eventTitle,
    eventDate: data.eventDate || new Date().toISOString().split("T")[0],
    certificateType: data.certificateType,
    issuedAt: new Date().toISOString(),
    issuedBy: "e-DAM Executive Board & Faculty Advisor",
    status: "valid",
    verificationCode: certNumber,
  };
  saveStoredCertificates([newCert, ...certs]);
  return newCert;
}

export function toggleCertificateStatus(certId: string): IssuedCertificate | null {
  const certs = getStoredCertificates();
  const index = certs.findIndex((c) => c.id === certId || c.certificateNumber === certId);
  if (index === -1) return null;
  const curr = certs[index];
  const nextStatus = curr.status === "valid" ? "revoked" : "valid";
  const updated: IssuedCertificate = {
    ...curr,
    status: nextStatus,
    revokedAt: nextStatus === "revoked" ? new Date().toISOString() : undefined,
    revokedReason: nextStatus === "revoked" ? "Administrative verification hold" : undefined,
  };
  certs[index] = updated;
  saveStoredCertificates(certs);
  return updated;
}

/**
 * Event Registrations Registry
 * Never seeds hardcoded personal student PII into the browser bundle.
 */
export function getStoredRegistrations(): EventRegistration[] {
  try {
    const raw = localStorage.getItem(REGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Could not read registrations from localStorage", e);
  }
  return [];
}

export function saveStoredRegistrations(regs: EventRegistration[]) {
  try {
    localStorage.setItem(REGS_STORAGE_KEY, JSON.stringify(regs));
  } catch (e) {
    console.warn("Could not save registrations to localStorage", e);
  }
}

export function registerAttendee(data: Omit<EventRegistration, "id" | "submittedAt">): EventRegistration {
  const regs = getStoredRegistrations();
  const newReg: EventRegistration = {
    ...data,
    id: `reg-${Date.now().toString(36)}`,
    submittedAt: new Date().toISOString(),
    status: "registered",
  };
  saveStoredRegistrations([newReg, ...regs]);
  return newReg;
}

/**
 * Normalizes snake_case or mixed API payloads from Neon PostgreSQL into frontend types
 */
export function mapApiEvent(raw: any): ChapterEvent {
  const modeRaw = String(raw.mode || "In-Person").toLowerCase();
  const mode: ChapterEvent["mode"] =
    modeRaw === "online" || modeRaw === "virtual"
      ? "Virtual"
      : modeRaw === "hybrid"
      ? "Hybrid"
      : "In-Person";

  const statusRaw = String(raw.status || "upcoming").toLowerCase();
  const status: ChapterEvent["status"] =
    statusRaw === "completed" || statusRaw === "past"
      ? "past"
      : statusRaw === "cancelled"
      ? "cancelled"
      : statusRaw === "postponed"
      ? "postponed"
      : statusRaw === "registration_closed"
      ? "registration_closed"
      : "upcoming";

  return {
    id: String(raw.id),
    slug: String(raw.slug || raw.id),
    title: String(raw.title || ""),
    tagline: String(raw.tagline || ""),
    category: (raw.category || "Workshop") as ChapterEvent["category"],
    status,
    date: String(raw.date || ""),
    time: String(raw.time || ""),
    venue: String(raw.venue || "IARE Campus"),
    mode,
    description: String(raw.description || ""),
    detailedOverview: Array.isArray(raw.detailed_overview ?? raw.detailedOverview)
      ? (raw.detailed_overview ?? raw.detailedOverview)
      : [],
    prerequisites: Array.isArray(raw.prerequisites) ? raw.prerequisites : [],
    takeaways: Array.isArray(raw.takeaways) ? raw.takeaways : [],
    speakers: Array.isArray(raw.speakers) ? raw.speakers : [],
    registrationDeadline: String(raw.registration_deadline ?? raw.registrationDeadline ?? raw.date ?? ""),
    registrationOpen: Boolean(raw.registration_open ?? raw.registrationOpen ?? true),
    registrationUrl: raw.registration_url ?? raw.registrationUrl ?? undefined,
    bannerImage: raw.banner_image ?? raw.bannerImage ?? undefined,
    capacity: typeof raw.capacity === "number" ? raw.capacity : 100,
    featured: Boolean(raw.featured),
    googleFormId: raw.google_form_id ?? raw.googleFormId ?? undefined,
    googleFormUrl: raw.google_form_url ?? raw.googleFormUrl ?? undefined,
    formStatus: raw.form_status ?? raw.formStatus ?? undefined,
    responseCount: typeof (raw.response_count ?? raw.responseCount) === "number"
      ? (raw.response_count ?? raw.responseCount)
      : 0,
    createdAt: raw.created_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  };
}

export function mapApiCertificate(raw: any): IssuedCertificate {
  const certNum = String(raw.certificate_number ?? raw.certificateNumber ?? raw.id);
  return {
    id: String(raw.id || certNum),
    certificateNumber: certNum,
    recipientName: String(raw.recipient_name ?? raw.recipientName ?? ""),
    recipientEmail: String(raw.recipient_email ?? raw.recipientEmail ?? ""),
    recipientRollNumber: raw.recipient_roll_number ?? raw.recipientRollNumber ?? raw.rollNumber ?? undefined,
    recipientDepartment: raw.recipient_department ?? raw.recipientDepartment ?? raw.department ?? undefined,
    eventId: String(raw.event_id ?? raw.eventId ?? ""),
    eventTitle: String(raw.event_title ?? raw.eventTitle ?? ""),
    eventDate: raw.event_date ?? raw.eventDate ?? undefined,
    certificateType: (raw.certificate_type ?? raw.certificateType ?? raw.type ?? "participation") as IssuedCertificate["certificateType"],
    issuedAt: String(raw.issued_at ?? raw.issuedAt ?? new Date().toISOString()),
    issuedBy: String(raw.issued_by ?? raw.issuedBy ?? "e-DAM Executive Council"),
    status: raw.status === "revoked" ? "revoked" : "valid",
    revokedAt: raw.revoked_at ?? raw.revokedAt ?? undefined,
    revokedReason: raw.revoked_reason ?? raw.revokedReason ?? undefined,
    verificationCode: certNum,
  };
}

export function mapApiRegistration(raw: any): EventRegistration {
  return {
    id: String(raw.id),
    eventId: String(raw.event_id ?? raw.eventId ?? ""),
    eventTitle: raw.event_title ?? raw.eventTitle ?? undefined,
    attendeeName: String(raw.full_name ?? raw.attendeeName ?? ""),
    email: String(raw.email ?? ""),
    phone: raw.phone ?? undefined,
    rollNumber: String(raw.roll_number ?? raw.rollNumber ?? ""),
    department: String(raw.department ?? ""),
    yearOfStudy: String(raw.year_of_study ?? raw.yearOfStudy ?? ""),
    submittedAt: String(raw.submitted_at ?? raw.submittedAt ?? new Date().toISOString()),
    status: "registered",
  };
}

