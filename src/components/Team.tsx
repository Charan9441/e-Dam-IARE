import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'motion/react';
import { FaGithub as Github, FaInstagram as Instagram, FaLinkedin as Linkedin } from 'react-icons/fa';
import { ArrowUpRight } from 'lucide-react';

const team = [
  { id: 1, name: "K. Sai Charan", role: "Community Lead", domain: "Core", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80" },
  { id: 2, name: "Sarah Chen", role: "Design Lead", domain: "UI/UX", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80" },
  { id: 3, name: "Marcus Johnson", role: "Tech Lead", domain: "Full-Stack", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80" },
  { id: 4, name: "Priya Patel", role: "Marketing Head", domain: "Marketing", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80" },
  { id: 5, name: "David Kim", role: "Cybersecurity Head", domain: "Security", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80" },
  { id: 6, name: "Elena Rodriguez", role: "AI & ML Lead", domain: "AI/ML", img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&q=80" },
];

export const Team = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section id="team" className="py-24 relative" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div
          className="mb-16 md:mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <h2 className="text-sm font-bold tracking-[0.2em] text-[#8B5CF6] uppercase mb-4">The People Behind It</h2>
            <h3 className="text-4xl md:text-5xl font-bold font-heading">MEET THE TEAM</h3>
          </div>
          <Link
            to="/team"
            className="text-[#8B5CF6] hover:text-white transition-colors flex items-center gap-2 pb-2 border-b border-[#8B5CF6]/30 hover:border-white font-semibold text-sm"
          >
            <span>View Full Council &amp; Mentors</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {team.map((member, index) => (
            <TeamMemberCard key={member.id} member={member} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
};

const TeamMemberCard = ({ member, index, isInView }: { member: typeof team[0], index: number, isInView: boolean }) => {
  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
    >
      <div className="relative overflow-hidden rounded-2xl aspect-[4/5] bg-[#0B0614] border border-white/10 group-hover:border-[#8B5CF6]/40 transition-colors duration-300">
        <img
          src={member.img}
          alt={member.name}
          className="absolute inset-0 w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/60 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-[#C4B5FD]">
          {member.domain}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex gap-2.5">
            <a
              href="https://in.linkedin.com/company/edamcommunity"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} on LinkedIn`}
              className="w-8 h-8 rounded-md bg-white/10 hover:bg-[#8B5CF6] hover:text-white flex items-center justify-center text-white/70 transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://www.instagram.com/edam.iare/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} on Instagram`}
              className="w-8 h-8 rounded-md bg-white/10 hover:bg-[#8B5CF6] hover:text-white flex items-center justify-center text-white/70 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://github.com/edam-iare"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} on GitHub`}
              className="w-8 h-8 rounded-md bg-white/10 hover:bg-[#8B5CF6] hover:text-white flex items-center justify-center text-white/70 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <h4 className="text-lg font-bold font-heading text-[#F5F3FF]">{member.name}</h4>
        <p className="text-sm text-[#928A9F]">{member.role}</p>
      </div>
    </motion.div>
  );
};
