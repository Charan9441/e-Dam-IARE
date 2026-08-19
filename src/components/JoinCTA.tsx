import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export const JoinCTA = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <section id="join" className="py-32 relative bg-black overflow-hidden" ref={ref}>
      {/* Background Graphic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* SVG connecting line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
        <motion.path 
          d={`M 0 ${typeof window !== 'undefined' ? window.innerHeight / 2 : 500} Q ${typeof window !== 'undefined' ? window.innerWidth / 2 : 800} 0, ${typeof window !== 'undefined' ? window.innerWidth : 1600} ${typeof window !== 'undefined' ? window.innerHeight / 2 : 500}`}
          fill="none" 
          stroke="url(#cta-line)" 
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id="cta-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>

      <div className="container relative z-10 mx-auto px-6 text-center flex flex-col items-center">
        <motion.div
          className="w-32 h-32 rounded-full border border-primary/30 flex items-center justify-center mb-10 bg-black/50 backdrop-blur-md relative"
          initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
          animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.5, rotate: -90 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        >
          {/* Animated rings */}
          <motion.div 
            className="absolute inset-0 rounded-full border border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute inset-4 rounded-full border border-primary-bright border-b-transparent"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          
          <div className="font-heading font-bold text-2xl tracking-tighter">
            e-DAM
          </div>
        </motion.div>

        <motion.h2 
          className="text-5xl md:text-7xl font-bold tracking-tighter mb-12 max-w-4xl"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          READY TO CREATE <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-lavender">SOMETHING DIFFERENT?</span>
        </motion.h2>

        <motion.button 
          className="group flex items-center gap-4 px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:scale-95 transition-all duration-300"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <span>JOIN e-DAM</span>
          <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
        </motion.button>
      </div>
    </section>
  );
};
