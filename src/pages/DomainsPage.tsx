import React from "react";
import { Link } from "react-router-dom";
import {
  Palette,
  Code2,
  ShieldCheck,
  BarChart3,
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Layers,
  Wrench,
  FolderGit2,
} from "lucide-react";
import { EDAM_DOMAINS } from "@/data/edam-data";
import { Button } from "@/components/ui/Button";

const iconMap: Record<string, React.ElementType> = {
  Palette,
  Code2,
  ShieldCheck,
  BarChart3,
  BrainCircuit,
};

export const DomainsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] pt-28 pb-20">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/3 w-[600px] h-[400px] bg-[#8B5CF6]/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD] text-xs font-semibold uppercase tracking-widest mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>Core Technical Pillars</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-heading tracking-tight mb-4">
            The 5 Creative &amp; Engineering Domains
          </h1>
          <p className="text-base sm:text-lg text-[#928A9F] leading-relaxed">
            At e-DAM, we don't separate engineering from design. Explore our five specialized wings offering structured learning, hands-on sprints, and portfolio mentorship.
          </p>
        </div>

        {/* Domains List */}
        <div className="space-y-12">
          {EDAM_DOMAINS.map((domain, index) => {
            const Icon = iconMap[domain.iconName] || Layers;
            return (
              <div
                key={domain.id}
                id={domain.id}
                className="rounded-3xl bg-[#0B0614] border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 transition-all duration-300 p-8 sm:p-12 shadow-xl relative overflow-hidden"
              >
                {/* Glow Accent */}
                <div
                  className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20"
                  style={{ backgroundColor: domain.color }}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                        style={{ backgroundColor: `${domain.color}25`, border: `1px solid ${domain.color}50` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: domain.color }} />
                      </div>
                      <span className="text-xs font-mono font-bold tracking-widest text-[#928A9F]">
                        0{index + 1} / DOMAIN
                      </span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight">
                      {domain.name}
                    </h2>

                    <p className="text-sm sm:text-base text-[#C4B5FD] font-medium">
                      {domain.tagline}
                    </p>

                    <p className="text-sm text-[#928A9F] leading-relaxed">
                      {domain.description}
                    </p>

                    <div className="pt-2">
                      <Link to="/events">
                        <Button variant="outline" size="sm">
                          <span>View {domain.shortName} Sprints</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 lg:pt-0">
                    {/* Curriculum */}
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                        <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                        <span>Curriculum &amp; Skills</span>
                      </div>
                      <ul className="space-y-2 text-xs text-[#928A9F]">
                        {domain.curriculum.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tech Stack & Projects */}
                    <div className="space-y-6">
                      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                          <Wrench className="w-3.5 h-3.5 text-[#8B5CF6]" />
                          <span>Tooling &amp; Stack</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {domain.technologies.map((tech, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-black/40 text-[11px] font-medium text-white/80 border border-white/10"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                          <FolderGit2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                          <span>Featured Projects</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-[#928A9F]">
                          {domain.projects.map((proj, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="text-white/40 font-mono">→</span>
                              <span className="text-[#F5F3FF] font-medium">{proj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

