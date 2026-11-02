import React from "react";
import { Link } from "react-router-dom";
import {
  Rocket,
  Award,
  Users,
  ArrowRight,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export const InitiativesPage: React.FC = () => {
  const milestones = [
    {
      phase: "Phase 1: Foundations & Habit",
      days: "Days 1 â€“ 25",
      title: "Core Mechanics & First Prototypes",
      desc: "Daily commits, design fundamentals, tool mastery, and building 2 micro-projects from scratch.",
    },
    {
      phase: "Phase 2: Depth & Integration",
      days: "Days 26 â€“ 50",
      title: "Full-Stack & Component Architecture",
      desc: "Connecting APIs, database schemas, motion design tokens, and participating in the Mid-Sprint code audit.",
    },
    {
      phase: "Phase 3: Production Polish",
      days: "Days 51 â€“ 75",
      title: "Security, Performance & Deployments",
      desc: "Lighthouse audits, accessibility benchmarking (WCAG), Dockerization, and cloud deployment pipelines.",
    },
    {
      phase: "Phase 4: Capstone Showcase",
      days: "Days 76 â€“ 100",
      title: "Portfolio Launch & Demo Day",
      desc: "Shipping a production-ready application or design system, pitching to industry judges, and graduating with the 100 Days Credential.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] pt-28 pb-20">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/3 w-[650px] h-[400px] bg-[#8B5CF6]/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 max-w-6xl">
        {/* Hero Section */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD] text-xs font-semibold uppercase tracking-widest mb-4">
            <Rocket className="w-3.5 h-3.5" />
            <span>Signature Initiative</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-heading tracking-tight mb-4">
            100 Days of Tech
          </h1>
          <p className="text-base sm:text-lg text-[#928A9F] leading-relaxed">
            A transformative 100-day journey of deliberate practice, daily building, and peer accountability designed to turn passionate students into industry-ready builders.
          </p>
        </div>

        {/* Highlight Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0B0614] via-[#120A24] to-[#0B0614] border border-[#8B5CF6]/40 p-8 sm:p-12 mb-16 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-[#C026FF]/15 rounded-full blur-[90px] pointer-events-none" />

          <div className="max-w-2xl space-y-6">
            <span className="text-xs font-mono font-bold tracking-widest text-[#8B5CF6] uppercase">
              Cohort 2026 Registration Open
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white">
              Commit to Daily Progress. Ship 10 Portfolio Pieces.
            </h2>
            <p className="text-sm sm:text-base text-[#928A9F] leading-relaxed">
              Whether you are designing accessible Figma interfaces, authoring full-stack web platforms, or fine-tuning machine learning models, 100 Days of Tech gives you structure, weekly reviews, and verified credentials.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link to="/contact">
                <Button variant="primary" size="lg">
                  <span>Join 100 Days of Tech</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/events">
                <Button variant="outline" size="lg">
                  <span>Browse Cohort Dates</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Phases Roadmap */}
        <div className="mb-20">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl font-bold font-heading mb-2">The 100-Day Progression Roadmap</h2>
            <p className="text-sm text-[#928A9F]">How we guide students from first principles to capstone production.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#0B0614] border border-[#8B5CF6]/20 p-6 space-y-4 hover:border-[#8B5CF6]/50 transition-colors shadow-lg"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#8B5CF6] font-bold">{m.days}</span>
                  <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[10px]">
                    0{idx + 1}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#C4B5FD] uppercase tracking-wider mb-1">
                    {m.phase}
                  </h4>
                  <h3 className="text-lg font-bold font-heading text-white mb-2">
                    {m.title}
                  </h3>
                  <p className="text-xs text-[#928A9F] leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-[#0B0614] border border-white/10 p-6 space-y-3">
            <Users className="w-8 h-8 text-[#8B5CF6]" />
            <h3 className="text-lg font-bold text-white">Peer Accountability Circles</h3>
            <p className="text-xs text-[#928A9F] leading-relaxed">
              Get matched with a pod of 4 peers across your domain for daily standups, code reviews, and mutual encouragement.
            </p>
          </div>

          <div className="rounded-2xl bg-[#0B0614] border border-white/10 p-6 space-y-3">
            <Target className="w-8 h-8 text-[#C026FF]" />
            <h3 className="text-lg font-bold text-white">Curated Milestone Prompts</h3>
            <p className="text-xs text-[#928A9F] leading-relaxed">
              Never wonder what to build next. Follow battle-tested prompts crafted by senior students and industry mentors.
            </p>
          </div>

          <div className="rounded-2xl bg-[#0B0614] border border-white/10 p-6 space-y-3">
            <Award className="w-8 h-8 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Accredited Completion Credential</h3>
            <p className="text-xs text-[#928A9F] leading-relaxed">
              Earn a verifiable cryptographic credential with a public showcase link for LinkedIn, resumes, and portfolios.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};



