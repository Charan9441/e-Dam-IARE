import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Menu, X, Award } from 'lucide-react';
import { EdamLogo } from './EdamLogo';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Events', href: '/events' },
    { label: 'Domains', href: '/domains' },
    { label: '100 Days of Tech', href: '/initiatives' },
    { label: 'Team', href: '/team' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Verify', href: '/verify' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled || location.pathname !== '/'
            ? 'py-3.5 bg-[#030305]/90 backdrop-blur-xl border-b border-[#8B5CF6]/20 shadow-[0_10px_30px_rgba(3,3,5,0.8)]'
            : 'py-6 bg-transparent'
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <EdamLogo size={34} />
            <div className="text-xl font-extrabold tracking-wider flex items-center gap-1.5 text-[#F5F3FF]">
              <span>e-DAM</span>
              <span className="text-[#8B5CF6] font-light">IARE</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`transition-colors relative py-1 ${
                    isActive ? 'text-[#C4B5FD] font-bold' : 'text-[#928A9F] hover:text-[#F5F3FF]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#8B5CF6] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/verify"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-[#C4B5FD] hover:text-white hover:bg-white/5 border border-transparent hover:border-[#8B5CF6]/30 transition-all"
            >
              <Award className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Verify Credential</span>
            </Link>

            <Link
              to="/contact"
              className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white shadow-lg shadow-[#8B5CF6]/20 transition-all text-xs font-bold"
            >
              <span>Join Community</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-[#F5F3FF] hover:text-[#8B5CF6] transition-colors"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </motion.header>

      {/* Mobile Slide-Out Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-4/5 max-w-sm bg-[#0B0614] border-l border-[#8B5CF6]/30 p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-2.5">
                    <EdamLogo size={30} />
                    <span className="font-extrabold text-white">e-DAM IARE</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-white/60 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex flex-col space-y-3">
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.href;
                    return (
                      <Link
                        key={link.label}
                        to={link.href}
                        className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/40'
                            : 'text-[#928A9F] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-6 border-t border-white/10 space-y-3">
                <Link
                  to="/verify"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white"
                >
                  <Award className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Verify Credential</span>
                </Link>

                <Link
                  to="/contact"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#8B5CF6] text-white text-xs font-bold shadow-lg shadow-[#8B5CF6]/30"
                >
                  <span>Join e-DAM</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

