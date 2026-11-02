import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ArrowUpRight, Award } from 'lucide-react';
import { FaGithub as Github, FaInstagram as Instagram, FaLinkedin as Linkedin } from 'react-icons/fa';
import { EdamLogo } from './EdamLogo';
import { EDAM_INFO } from '@/data/edam-data';

export const Footer = () => {
  return (
    <footer className="relative bg-black pt-20 pb-12 border-t border-white/10 overflow-hidden">
      {/* Animated tiny accent line */}
      <motion.div 
        className="absolute top-0 left-0 h-px bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent w-1/3"
        animate={{ left: ['-33%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-16 border-b border-white/10">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <EdamLogo size={40} />
              <div className="text-3xl font-bold tracking-wider font-heading flex items-center gap-2 text-white">
                <span>e-DAM</span>
                <span className="text-[#8B5CF6] font-light">IARE</span>
              </div>
            </Link>
            <p className="text-xs tracking-[0.2em] text-[#C4B5FD] uppercase font-bold">
              e-Designing and Marketing
            </p>
            <p className="text-sm text-[#928A9F] max-w-sm leading-relaxed">
              The premier design, engineering, and digital marketing student community at Institute of Aeronautical Engineering (IARE), Hyderabad.
            </p>
            <div className="flex gap-3 pt-2">
              <SocialLink href={EDAM_INFO.socials.instagram} icon={<Instagram className="w-4 h-4" />} label="Instagram" />
              <SocialLink href={EDAM_INFO.socials.linkedin} icon={<Linkedin className="w-4 h-4" />} label="LinkedIn" />
              <SocialLink href={EDAM_INFO.socials.github} icon={<Github className="w-4 h-4" />} label="GitHub" />
              <SocialLink href={`mailto:${EDAM_INFO.contactEmail}`} icon={<Mail className="w-4 h-4" />} label="Email" />
            </div>
          </div>

          {/* Nav Links Column 1: Community */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-white">
              Explore Community
            </h4>
            <ul className="space-y-2 text-xs text-[#928A9F]">
              <li>
                <Link to="/events" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Upcoming Events &amp; Sprints</span>
                </Link>
              </li>
              <li>
                <Link to="/domains" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>The 5 Technical Domains</span>
                </Link>
              </li>
              <li>
                <Link to="/initiatives" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>100 Days of Tech Challenge</span>
                </Link>
              </li>
              <li>
                <Link to="/team" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Leadership Council &amp; Leads</span>
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Visual Gallery</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Links Column 2: Trust & Tools */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-white">
              Institutional Tools &amp; Portal
            </h4>
            <ul className="space-y-2 text-xs text-[#928A9F]">
              <li>
                <Link to="/verify" className="hover:text-[#C4B5FD] transition-colors flex items-center gap-1.5 font-medium text-white/80">
                  <Award className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>Credential &amp; Certificate Verification</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Join e-DAM &amp; Contact Us</span>
                </Link>
              </li>
              <li>
                <a
                  href={EDAM_INFO.socials.iareWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>IARE Official College Website</span>
                  <ArrowUpRight className="w-3 h-3 text-white/40" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#928A9F]">
          <p>© 2026 e-DAM (e-Designing and Marketing), IARE Hyderabad. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Conduct</Link>
            <Link to="/verify" className="hover:text-white transition-colors">Verify Credential</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialLink = ({ icon, href, label }: { icon: React.ReactNode; href: string; label: string }) => (
  <a 
    href={href} 
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 hover:border-[#8B5CF6]/50 transition-all duration-300"
  >
    {icon}
  </a>
);

