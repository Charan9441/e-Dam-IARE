import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Lock, Database, Eye, FileText } from "lucide-react";
import { EDAM_INFO } from "@/data/edam-data";

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] pt-28 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center text-xs font-semibold text-[#928A9F] hover:text-[#C4B5FD] transition-colors mb-6 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Institutional Data Governance</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold font-heading tracking-tight mb-2">
          Privacy Policy &amp; Student Data Governance
        </h1>
        <p className="text-xs sm:text-sm text-[#928A9F] mb-10">
          Last updated: October 2026 • e-DAM (e-Designing and Marketing), Institute of Aeronautical Engineering
        </p>

        <div className="rounded-3xl bg-[#0B0614] border border-white/10 p-8 sm:p-12 space-y-8 text-sm text-[#928A9F] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <Lock className="w-4 h-4 text-[#8B5CF6]" />
              1. Purpose of Data Collection
            </h2>
            <p>
              e-DAM at Institute of Aeronautical Engineering collects student academic and identification information (including full name, roll number, department, year of study, institutional email address, and WhatsApp contact) solely for organizing workshops, validating event attendance, maintaining merit records, and issuing cryptographically verified certificates.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <Database className="w-4 h-4 text-[#8B5CF6]" />
              2. Data Protection &amp; Integrity
            </h2>
            <p>
              All registration and certification records are maintained securely in protected Neon PostgreSQL databases, encrypted Cloudflare R2 object storage, and designated institutional Google Sheets spreadsheets. Access is strictly restricted to authorized chapter executive council officers and appointed faculty advisors.
            </p>
            <p className="text-[#C4B5FD] font-medium">
              We never sell, rent, monetize, or expose student personal information to third-party commercial marketing agencies or unverified vendors under any circumstance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <Eye className="w-4 h-4 text-[#8B5CF6]" />
              3. Public Verification Portal
            </h2>
            <p>
              When a participant is issued a certificate or award, the recipient's name, roll number, awarded event title, and credential ID become publicly verifiable through the /verify endpoint to support student portfolio presentation to employers and academic institutions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <FileText className="w-4 h-4 text-[#8B5CF6]" />
              4. Data Inquiries &amp; Deletion Requests
            </h2>
            <p>
              Students who wish to inspect, update, or request removal of their registration profile may contact the chapter executive council at <span className="text-white font-mono">{EDAM_INFO.contactEmail}</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

