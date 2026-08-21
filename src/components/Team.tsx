import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { FaGithub as Github, FaInstagram as Instagram, FaLinkedin as Linkedin } from 'react-icons/fa';

const team = [
  { id: 1, name: "Alex Mercer", role: "President", domain: "Core", img: "https://i.pravatar.cc/400?img=11" },
  { id: 2, name: "Sarah Chen", role: "Design Lead", domain: "Design", img: "https://i.pravatar.cc/400?img=5" },
  { id: 3, name: "Marcus Johnson", role: "Tech Lead", domain: "Development", img: "https://i.pravatar.cc/400?img=12" },
  { id: 4, name: "Priya Patel", role: "Marketing Head", domain: "Marketing", img: "https://i.pravatar.cc/400?img=20" },
  { id: 5, name: "David Kim", role: "Media Director", domain: "Media", img: "https://i.pravatar.cc/400?img=33" },
  { id: 6, name: "Elena Rodriguez", role: "Events Head", domain: "Core", img: "https://i.pravatar.cc/400?img=43" },
];

export const Team = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section id="team" className="py-24 relative" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div
          className="mb-16 md:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-4">The People Behind It</h2>
          <h3 className="text-4xl md:text-5xl font-bold">MEET THE TEAM</h3>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {team.map((member, index) => (
            <TeamMember key={member.id} member={member} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
};

const TeamMember = ({ member, index, isInView }: { member: typeof team[0], index: number, isInView: boolean }) => {
  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
    >
      <div className="relative overflow-hidden rounded-xl aspect-[4/5] bg-surface border border-white/10 group-hover:border-primary/40 transition-colors duration-300">
        <img
          src={member.img}
          alt={member.name}
          className="absolute inset-0 w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />

        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-background/60 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-white/80">
          {member.domain}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex gap-2.5">
            <a href="#" aria-label={`${member.name} on LinkedIn`} className="w-8 h-8 rounded-md bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center text-white/70 transition-colors">
              <Linkedin className="w-3.5 h-3.5" />
            </a>
            <a href="#" aria-label={`${member.name} on Instagram`} className="w-8 h-8 rounded-md bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center text-white/70 transition-colors">
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a href="#" aria-label={`${member.name} on GitHub`} className="w-8 h-8 rounded-md bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center text-white/70 transition-colors">
              <Github className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <h4 className="text-lg font-bold font-heading text-[#F5F3FF]">{member.name}</h4>
        <p className="text-sm text-muted">{member.role}</p>
      </div>
    </motion.div>
  );
};
