import React from "react";
import { Link } from "react-router-dom";
import { FileCheck, ArrowLeft, Users, ShieldAlert, Award } from "lucide-react";


export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] pt-28 pb-20">
      <div className="container mx-auto px-6 max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center text-xs font-semibold text-[#928A9F] hover:text-[#C4B5FD] transition-colors mb-6 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD] text-xs font-semibold uppercase tracking-widest mb-4">
          <FileCheck className="w-3.5 h-3.5" />
          <span>Community Standards</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold font-heading tracking-tight mb-2">
          Terms of Participation &amp; Code of Conduct
        </h1>
        <p className="text-xs sm:text-sm text-[#928A9F] mb-10">
          e-DAM Community Guidelines â€¢ Institute of Aeronautical Engineering (IARE)
        </p>

        <div className="rounded-3xl bg-[#0B0614] border border-white/10 p-8 sm:p-12 space-y-8 text-sm text-[#928A9F] leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <Users className="w-4 h-4 text-[#8B5CF6]" />
              1. Collaborative Environment &amp; Respect
            </h2>
            <p>
              e-DAM is dedicated to providing an inclusive, harassment-free learning and collaboration experience for every student regardless of gender, branch, year of study, technical proficiency, or background. We prioritize constructive feedback, mutual growth, and peer support.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <ShieldAlert className="w-4 h-4 text-[#8B5CF6]" />
              2. Intellectual Property &amp; Academic Honesty
            </h2>
            <p>
              All code authored and designs crafted during e-DAM hackathons and sprints must represent the authentic work of the participating squad. Plagiarism, unlicensed redistribution of proprietary college software, or unauthorized offensive cyber testing against institute network assets is strictly forbidden and subject to disciplinary action.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <Award className="w-4 h-4 text-[#8B5CF6]" />
              3. Certificate Issuance &amp; Authenticity
            </h2>
            <p>
              e-DAM credentials and certificates are non-transferable and tied to verified attendance and project submission. Any attempt to tamper with credential identifiers, forge signatures, or distribute fraudulent certificates will result in immediate credential revocation and formal notification to college faculty authorities.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};


