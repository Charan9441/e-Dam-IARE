import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Menu } from 'lucide-react';
import { EdamLogo } from './EdamLogo';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = ['Home', 'About', 'Domains', 'Events', 'Team', 'Projects', 'Contact'];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'py-3.5 bg-[#030305]/85 backdrop-blur-xl border-b border-[#8B5CF6]/20 shadow-[0_10px_30px_rgba(3,3,5,0.8)]' : 'py-6 bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <a href="#home" className="flex items-center gap-3 group">
          <EdamLogo size={34} />
          <div className="text-xl font-extrabold tracking-wider flex items-center gap-1.5 text-[#F5F3FF]">
            <span>e-DAM</span>
            <span className="text-[#8B5CF6] font-light">IARE</span>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <a 
              key={link} 
              href={`#${link.toLowerCase()}`}
              className="text-[#928A9F] hover:text-[#F5F3FF] transition-colors relative group py-1"
            >
              {link}
              <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-[#8B5CF6] transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <a
            href="#join"
            className="group flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-[#8B5CF6]/30 hover:border-[#8B5CF6] transition-all text-sm font-semibold"
          >
            <span>Join e-DAM</span>
            <ArrowRight className="w-4 h-4 text-[#8B5CF6] group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <button className="md:hidden text-[#F5F3FF]">
          <Menu />
        </button>
      </div>
    </motion.header>
  );
};
