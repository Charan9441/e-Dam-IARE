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

      <div className="container relative z-10 mx-auto px-6 text-center flex flex-col items-center">
        <motion.div
          className="w-32 h-32 rounded-full border border-primary/30 flex items-center justify-center mb-10 bg-black/50 backdrop-blur-md relative"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        >
          <div className="font-heading italic font-medium text-2xl tracking-tight">
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
          <span className="font-heading italic font-medium text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-lavender">something different?</span>
        </motion.h2>

        <motion.button
          className="group flex items-center gap-4 px-10 py-5 bg-white text-black rounded-lg font-bold text-lg hover:bg-white/90 transition-colors duration-300"
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
