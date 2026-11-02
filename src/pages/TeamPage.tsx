import React, { useState } from "react";
import { Users } from "lucide-react";
import { EDAM_TEAM } from "@/data/edam-data";
import { MemberCard } from "@/components/team/MemberCard";

type TeamCategory = "All" | "Faculty Advisors" | "Core Leads" | "Domain Heads" | "Media & Design" | "Coordinators";

export const TeamPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<TeamCategory>("All");

  const categories: TeamCategory[] = [
    "All",
    "Faculty Advisors",
    "Core Leads",
    "Domain Heads",
    "Media & Design",
    "Coordinators",
  ];

  const filteredTeam = selectedCategory === "All"
    ? EDAM_TEAM
    : EDAM_TEAM.filter((m) => m.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] pt-28 pb-20">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[700px] h-[400px] bg-[#8B5CF6]/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD] text-xs font-semibold uppercase tracking-widest mb-4">
            <Users className="w-3.5 h-3.5" />
            <span>Community Leadership</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-heading tracking-tight mb-4">
            Meet the e-DAM Council
          </h1>
          <p className="text-base sm:text-lg text-[#928A9F] leading-relaxed">
            The visionary faculty mentors, student executives, domain heads, and coordinators driving technical innovation and design excellence across IARE.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  active
                    ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/25 border border-[#A855F7]/40"
                    : "bg-[#0B0614] text-[#928A9F] hover:text-white hover:bg-white/5 border border-white/10"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeam.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
};


