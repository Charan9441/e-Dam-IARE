import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Code2, MonitorPlay, PenTool, Sparkles } from 'lucide-react';

export const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <section id="about" className="py-24 relative overflow-hidden" ref={ref}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="flex flex-col gap-8">
            <motion.h2 
              className="text-4xl md:text-5xl font-extrabold leading-tight text-[#F5F3FF]"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              MORE THAN A CLUB.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#C4B5FD]">
                A CREATIVE TECH COMMUNITY.
              </span>
            </motion.h2>

            <div className="flex flex-col gap-6 text-lg text-[#928A9F]">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              >
                e-DAM (e-Designing and Marketing) is the premier technical community at IARE where design meets technology. We are a collective of developers, designers, and digital creators pushing the boundaries of what's possible.
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              >
                Our mission is to foster digital innovation and creative thinking. Whether you're building next-gen web applications, crafting beautiful user interfaces, or strategizing digital marketing campaigns, e-DAM provides the platform to transform ideas into reality.
              </motion.p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="flex gap-6 pt-4"
            >
              <div className="flex items-center gap-2 text-[#F5F3FF]">
                <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
                <span className="font-medium">Innovation</span>
              </div>
              <div className="flex items-center gap-2 text-[#F5F3FF]">
                <Code2 className="w-5 h-5 text-[#8B5CF6]" />
                <span className="font-medium">Technology</span>
              </div>
              <div className="flex items-center gap-2 text-[#F5F3FF]">
                <PenTool className="w-5 h-5 text-[#8B5CF6]" />
                <span className="font-medium">Design</span>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="relative h-[500px] w-full rounded-3xl glass p-8 overflow-hidden group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Animated background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/30 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-1000"></div>
            
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_100%,transparent_100%)]"></div>
            
            {/* Abstract UI Elements */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-6">
              <motion.div 
                className="w-48 h-32 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md p-4 flex flex-col gap-3 shadow-2xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <PenTool className="w-4 h-4 text-primary" />
                </div>
                <div className="w-3/4 h-2 bg-white/20 rounded-full"></div>
                <div className="w-1/2 h-2 bg-white/10 rounded-full"></div>
              </motion.div>
              
              <div className="flex gap-6">
                <motion.div 
                  className="w-32 h-32 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md p-4 flex flex-col gap-3 shadow-2xl"
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary-bright/20 flex items-center justify-center">
                    <Code2 className="w-4 h-4 text-primary-bright" />
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full mt-auto"></div>
                </motion.div>
                
                <motion.div 
                  className="w-40 h-40 rounded-xl bg-primary/10 border border-primary/30 backdrop-blur-md p-4 flex flex-col gap-3 shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center mb-auto">
                    <MonitorPlay className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-full h-2 bg-primary/40 rounded-full"></div>
                  <div className="w-2/3 h-2 bg-primary/20 rounded-full"></div>
                </motion.div>
              </div>
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
};
