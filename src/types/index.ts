export interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

export type EventStatus = "upcoming" | "past" | "postponed" | "cancelled" | "registration_closed";

export type EventCategory = 
  | "All"
  | "Design"
  | "Development"
  | "Cybersecurity"
  | "Data Science"
  | "AI & ML"
  | "Marketing"
  | "Hackathon"
  | "Workshop"
  | "Tech Talk"
  | "All Domains";

export interface EventSpeaker {
  name: string;
  role: string;
  organization: string;
  avatarUrl?: string;
}

export interface ChapterEvent {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: EventCategory;
  status: EventStatus;
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // e.g. "10:00 AM - 04:00 PM IST"
  venue: string; // e.g. "Seminar Hall 1, Bharadwaja Block, IARE Campus"
  mode: "In-Person" | "Virtual" | "Hybrid";
  description: string;
  detailedOverview: string[];
  prerequisites: string[];
  takeaways: string[];
  speakers: EventSpeaker[];
  registrationDeadline: string;
  registrationOpen: boolean;
  registrationUrl?: string;
  bannerImage?: string;
  capacity?: number;
  featured?: boolean;
  // Google Form & Sheets Automation Metadata
  googleFormId?: string;
  googleFormUrl?: string;
  googleFormEditUrl?: string;
  formStatus?: "active" | "closed" | "failed" | "not_created";
  responseCount?: number;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: "Faculty Advisors" | "Core Leads" | "Domain Heads" | "Technical Leads" | "Media & Design" | "Coordinators";
  department: string;
  academicYear?: string;
  bio: string;
  imageUrl?: string;
  domain?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
  email?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  date: string;
  category: "Hackathons" | "Workshops" | "Design Sprints" | "Community" | "Celebrations";
  imageUrl: string;
  caption: string;
}

export type CertificateType = "participation" | "merit" | "excellence" | "appreciation" | "speaker" | "coordinator";

export interface IssuedCertificate {
  id: string;
  certificateNumber: string;
  recipientName: string;
  recipientEmail: string;
  recipientRollNumber?: string;
  recipientDepartment?: string;
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  certificateType: CertificateType;
  issuedAt: string;
  issuedBy?: string;
  status: "valid" | "revoked";
  revokedAt?: string;
  revokedReason?: string;
  verificationCode: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  type: CertificateType;
  title: string;
  subtitle: string;
  bodyText: string;
  signatories: Array<{ name: string; role: string; title?: string }>;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle?: string;
  attendeeName: string;
  email: string;
  phone?: string;
  rollNumber: string;
  department: string;
  yearOfStudy: string;
  submittedAt: string;
  status?: "registered" | "attended" | "cancelled";
  certificateIssued?: boolean;
}

export interface DomainInfo {
  id: string;
  name: string;
  shortName: string;
  color: string;
  iconName: string;
  tagline: string;
  description: string;
  curriculum: string[];
  technologies: string[];
  projects: string[];
  leadName?: string;
}

