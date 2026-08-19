import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';

export const Hero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / 40;
      const y = (e.clientY - innerHeight / 2) / 40;
      setMouseOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);

    const particles: any[] = [];
    const numParticles = Math.min(window.innerWidth / 12, 100);
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2.2 + 0.6,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    let animationFrame: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw faint connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 - dist / 650})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha})`;
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 bg-[#030305]">
      {/* Background Interactive Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0 opacity-50 mix-blend-screen pointer-events-none"
      />
      
      {/* Rotating Abstract Purple EDAM Energy Core */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] pointer-events-none transition-transform duration-75 ease-out"
        style={{
          transform: `translate(calc(-50% + ${mouseOffset.x}px), calc(-50% + ${mouseOffset.y}px))`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#5B21B6]/30 via-[#8B5CF6]/20 to-[#A855F7]/30 rounded-full blur-[140px] opacity-70 animate-pulse" />
        
        {/* Orbital Ring 1 */}
        <div className="absolute inset-10 border border-[#8B5CF6]/20 rounded-full animate-[spin_25s_linear_infinite]">
          <div className="absolute top-0 left-1/2 w-3 h-3 bg-[#A855F7] rounded-full blur-[2px] shadow-[0_0_12px_#A855F7]" />
        </div>

        {/* Orbital Ring 2 */}
        <div className="absolute inset-28 border border-[#A855F7]/15 rounded-full animate-[spin_40s_linear_infinite_reverse]">
          <div className="absolute bottom-0 right-1/2 w-2.5 h-2.5 bg-[#C4B5FD] rounded-full blur-[2px] shadow-[0_0_10px_#C4B5FD]" />
        </div>
      </div>

      {/* Grid Pattern Mask */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_75%_75%_at_50%_50%,black_35%,transparent_100%)] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 flex flex-col items-center text-center">
        {/* Recruitment Status Pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-[#8B5CF6]/35 bg-[#0B0614]/80 text-[#C4B5FD] text-xs md:text-sm font-semibold mb-8 backdrop-blur-xl shadow-[0_0_20px_rgba(139,92,246,0.25)]"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B5CF6] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8B5CF6]"></span>
          </span>
          <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />
          <span>e-DAM Recruitments 2026 Opening Soon</span>
        </motion.div>

        {/* Oversized Masked Headline Reveal */}
        <motion.h1 
          className="text-5xl md:text-7xl lg:text-[6.5rem] font-extrabold tracking-tighter leading-[1.05] mb-8 text-[#F5F3FF]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          WE DESIGN.<br />
          WE CREATE.<br />
          WE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#C4B5FD] drop-shadow-[0_0_30px_rgba(168,85,247,0.6)]">INNOVATE.</span>
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
            className="group relative px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white font-semibold rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_30px_rgba(139,92,246,0.45)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] flex items-center gap-2.5"
          >
            <Compass className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            <span>Explore e-DAM</span>
          </a>
          
          <a 
            href="#domains"
            className="group flex items-center gap-2 px-8 py-4 font-semibold text-[#F5F3FF] hover:text-white rounded-full border border-[#8B5CF6]/30 hover:border-[#8B5CF6] bg-[#0B0614]/60 hover:bg-[#0B0614] backdrop-blur-lg transition-all"
          >
            <span>Our Domains</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#8B5CF6]" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
