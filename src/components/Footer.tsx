import React from 'react';
import { motion } from 'motion/react';
import { Mail } from 'lucide-react';
import { FaGithub as Github, FaInstagram as Instagram, FaLinkedin as Linkedin } from 'react-icons/fa';
import { EdamLogo } from './EdamLogo';

export const Footer = () => {
  return (
    <footer className="relative bg-black pt-20 pb-10 border-t border-white/5 overflow-hidden">
      {/* Animated tiny line */}
      <motion.div 
        className="absolute top-0 left-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent w-1/3"
        animate={{ left: ['-33%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-16">
          
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
            <div className="flex items-center gap-3">
              <EdamLogo size={40} />
              <div className="text-3xl font-bold tracking-wider font-heading flex items-center gap-2">
                <span>e-DAM</span>
                <span className="text-primary font-light">IARE</span>
              </div>
            </div>
            <p className="text-muted tracking-[0.2em] text-xs uppercase font-medium">e-Designing and Marketing</p>
          </div>

          <div className="flex gap-6">
            <SocialLink href="#" icon={<Instagram />} />
            <SocialLink href="#" icon={<Linkedin />} />
            <SocialLink href="#" icon={<Github />} />
            <SocialLink href="#" icon={<Mail />} />
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
          <p>© 2026 e-DAM IARE. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialLink = ({ icon, href }: { icon: React.ReactNode, href: string }) => (
  <a 
    href={href} 
    className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 hover:border-primary/50 transition-all duration-300"
  >
    {icon}
  </a>
);
