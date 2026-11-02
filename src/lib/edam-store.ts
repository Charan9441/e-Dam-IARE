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
  return [
    {
      id: "reg-01",
      eventId: "edam-evt-01",
      eventTitle: "Design Sprint 2026: 48-Hour UI/UX Challenge",
      attendeeName: "K. Sai Charan",
      email: "charan@edam.iare.ac.in",
      phone: "+91 9876543210",
      rollNumber: "22951A0501",
      department: "CSE",
      yearOfStudy: "IV",
      submittedAt: "2026-10-24T12:00:00Z",
      status: "registered",
    },
    {
      id: "reg-02",
      eventId: "edam-evt-01",
      eventTitle: "Design Sprint 2026: 48-Hour UI/UX Challenge",
      attendeeName: "M. Sneha",
      email: "sneha.m@iare.ac.in",
      phone: "+91 9876543211",
      rollNumber: "23951A0588",
      department: "CSE",
      yearOfStudy: "III",
      submittedAt: "2026-10-24T13:30:00Z",
      status: "registered",
    },
    {
      id: "reg-03",
      eventId: "edam-evt-02",
      eventTitle: "Creative Coding: Three.js & Interactive WebGL",
      attendeeName: "V. Arjun",
      email: "arjun.v@iare.ac.in",
      phone: "+91 9876543212",
      rollNumber: "23951A6612",
      department: "AI/ML",
      yearOfStudy: "III",
      submittedAt: "2026-10-25T09:15:00Z",
      status: "registered",
    },
  ];
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

