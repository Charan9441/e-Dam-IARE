import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { PenTool, Code2, Megaphone, Camera, Sparkles, ArrowUpRight } from 'lucide-react';

const domainsData = [
  {
    id: "01",
    title: "UI/UX & Design",
    icon: PenTool,
    tagline: "Crafting intuitive digital experiences & visual identities.",
    skills: ["UI/UX Systems", "Graphic Design", "3D & Motion Art", "Visual Identity"],
    stats: "24+ Design Sprints Completed",
    color: "from-purple-500 via-purple-600 to-indigo-600"
  },
  {
    id: "02",
    title: "Web & Mobile Dev",
    icon: Code2,
    tagline: "Engineering high-performance web applications & platforms.",
    skills: ["Full-Stack Web", "Mobile Apps", "Creative Coding", "AI Integration"],
    stats: "18+ Live Web Platforms",
    color: "from-primary via-primary-bright to-primary-magenta"
  },
  {
    id: "03",
    title: "Digital Marketing",
    icon: Megaphone,
    tagline: "Amplifying brand presence through strategic growth media.",
    skills: ["Brand Strategy", "Social Growth", "SEO & Analytics", "Campaign Ops"],
    stats: "150k+ Audience Reach",
    color: "from-pink-500 via-rose-500 to-primary-magenta"
  },
  {
    id: "04",
    title: "Media Production",
    icon: Camera,
    tagline: "Capturing powerful visual storytelling through video & photography.",
    skills: ["Cinematography", "Photo Operations", "VFX & Post-Production", "Event Media"],
    stats: "40+ Events Covered",
    color: "from-blue-500 via-indigo-500 to-purple-600"
  }
];

export const Domains = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="domains" className="py-28 relative z-10" ref={ref}>
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cosmic Core Disciplines</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight">EXPLORE OUR DOMAINS</h3>
          </div>
          <p className="text-muted max-w-md text-base md:text-lg">
            We specialize in cross-disciplinary creation where design, code, marketing, and media converge into extraordinary projects.
          </p>
        </motion.div>

        {/* Interactive Domain Selector Tabs (Astral Frontier Style) */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {domainsData.map((d, index) => {
            const Icon = d.icon;
            const isActive = activeTab === index;
            return (
              <button
                key={d.id}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-full border transition-all duration-300 font-semibold text-sm backdrop-blur-xl ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-primary-magenta border-primary-bright text-white shadow-[0_0_25px_rgba(192,38,255,0.4)] scale-105'
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{d.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Domain Feature Highlight */}
        <div className="mb-16">
          <AnimatePresence mode="wait">
            {domainsData.map((domain, index) => {
              if (index !== activeTab) return null;
              const Icon = domain.icon;
              return (
                <motion.div
                  key={domain.id}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                  className="relative rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 via-surface/80 to-surface/90 p-8 md:p-12 backdrop-blur-2xl overflow-hidden shadow-[0_0_50px_rgba(192,38,255,0.15)]"
                >
                  <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                    <div className="lg:col-span-7 space-y-6">
                      <div className="inline-flex items-center gap-3">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${domain.color} shadow-lg shadow-primary/30`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-4xl font-extrabold text-white/20 font-heading">{domain.id}</span>
                      </div>

                      <h4 className="text-3xl md:text-4xl font-extrabold text-white">{domain.title}</h4>
                      <p className="text-muted text-lg leading-relaxed">{domain.tagline}</p>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {domain.skills.map((skill, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/90">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span>{skill}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 flex items-center gap-4">
                        <a 
                          href="#join" 
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:scale-105 transition-transform"
                        >
                          <span>Join {domain.title}</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">{domain.stats}</span>
                      </div>
                    </div>

                    <div className="lg:col-span-5 flex items-center justify-center">
                      <div className="relative w-full aspect-square max-w-sm rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md flex flex-col items-center justify-center text-center group">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/30 to-primary-magenta/30 flex items-center justify-center mb-6 border border-primary/40 group-hover:scale-110 transition-transform duration-500">
                          <Icon className="w-12 h-12 text-primary-bright" />
                        </div>
                        <div className="text-xl font-bold text-white mb-2">{domain.title} Hub</div>
                        <p className="text-xs text-muted">Empowering students to build world-class portfolios and launch creative tech projects.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
