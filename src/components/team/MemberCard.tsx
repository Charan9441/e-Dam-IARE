import React from "react";
import { FaLinkedin as Linkedin, FaGithub as Github } from "react-icons/fa";
import { Mail, Sparkles } from "lucide-react";
import type { TeamMember } from "@/types";

interface MemberCardProps {
  member: TeamMember;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member }) => {
  return (
    <div className="group relative rounded-2xl bg-[#0B0614]/70 hover:bg-[#100B1C] border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 transition-all duration-300 p-6 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-[#8B5CF6]/15 hover:-translate-y-1">
      {/* Top Accent */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-semibold text-[#8B5CF6] tracking-wider uppercase">
          {member.category}
        </span>
        {member.academicYear && (
          <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
            {member.academicYear}
          </span>
        )}
      </div>

      <div>
        {/* Avatar Placeholder or Image */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/30 via-[#5B21B6]/30 to-[#C026FF]/30 border border-[#8B5CF6]/40 flex items-center justify-center text-[#F5F3FF] font-heading font-extrabold text-xl mb-4 group-hover:scale-105 transition-transform">
          {member.imageUrl ? (
            <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <span>{member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
          )}
        </div>

        <h4 className="text-xl font-bold font-heading text-[#F5F3FF] group-hover:text-[#C4B5FD] transition-colors mb-1">
          {member.name}
        </h4>
        <p className="text-xs font-semibold text-[#8B5CF6] mb-1">{member.role}</p>
        <p className="text-xs text-[#928A9F] mb-3">{member.department}</p>
        
        {member.domain && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-[11px] text-white/70 mb-3 border border-white/5">
            <Sparkles className="w-3 h-3 text-[#A855F7]" />
            <span>{member.domain}</span>
          </div>
        )}

        <p className="text-xs text-[#928A9F] leading-relaxed line-clamp-3">
          {member.bio}
        </p>
      </div>

      {/* Social Icons */}
      <div className="pt-5 mt-4 border-t border-white/10 flex items-center gap-3 text-white/50">
        {member.linkedin && (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#8B5CF6] transition-colors p-1"
            aria-label={`${member.name} LinkedIn`}
          >
            <Linkedin className="w-4 h-4" />
          </a>
        )}
        {member.github && (
          <a
            href={member.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#8B5CF6] transition-colors p-1"
            aria-label={`${member.name} GitHub`}
          >
            <Github className="w-4 h-4" />
          </a>
        )}
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="hover:text-[#8B5CF6] transition-colors p-1"
            aria-label={`${member.name} Email`}
          >
            <Mail className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
};


