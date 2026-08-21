import { motion } from 'motion/react';
import { ArrowRight, Compass } from 'lucide-react';

export const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 bg-[#030305]">
      {/* Oversized watermark wordmark */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none select-none"
      >
        <span className="font-heading italic text-[28vw] leading-none text-white/[0.03] whitespace-nowrap">
          e-DAM
        </span>
      </div>

      {/* Grid Pattern Mask */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_75%_75%_at_50%_50%,black_35%,transparent_100%)] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 flex flex-col items-center text-center">
        {/* Recruitment Status Pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-[#8B5CF6]/35 bg-[#0B0614]/80 text-[#C4B5FD] text-xs md:text-sm font-semibold mb-8 backdrop-blur-xl"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B5CF6] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8B5CF6]"></span>
          </span>
          <span>e-DAM Recruitments 2026 Opening Soon</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-5xl md:text-7xl lg:text-[6.5rem] font-extrabold tracking-tighter leading-[1.05] mb-8 text-[#F5F3FF]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          WE DESIGN.<br />
          WE CREATE.<br />
          WE <span className="font-heading italic font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#C4B5FD]">innovate.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg md:text-xl text-[#928A9F] max-w-2xl mb-10 leading-relaxed font-normal"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        >
          The creative technology community of IARE.<br className="hidden md:block" />
          Where design, technology and digital art media converge.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
        >
          <a
            href="#about"
            className="group relative px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white font-semibold rounded-lg overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.45)] flex items-center gap-2.5"
          >
            <Compass className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            <span>Explore e-DAM</span>
          </a>

          <a
            href="#domains"
            className="group flex items-center gap-2 px-8 py-4 font-semibold text-[#F5F3FF] hover:text-white rounded-lg border border-[#8B5CF6]/30 hover:border-[#8B5CF6] bg-transparent hover:bg-[#0B0614] transition-all"
          >
            <span>Our Domains</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#8B5CF6]" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
