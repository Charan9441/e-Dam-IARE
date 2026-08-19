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
          className="mb-16 md:mb-24 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-4">The Minds Behind</h2>
          <h3 className="text-4xl md:text-5xl font-bold">MEET THE TEAM</h3>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
      className="group relative overflow-hidden rounded-2xl aspect-[3/4] bg-surface cursor-pointer"
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
    >
      <img 
        src={member.img} 
        alt={member.name} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      
      {/* Default Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent transition-opacity duration-500" />
      
      {/* Purple Hover Overlay */}
      <div className="absolute inset-0 bg-primary/80 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Domain Badge */}
      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-background/50 backdrop-blur-md border border-white/10 text-xs font-bold tracking-widest uppercase">
        {member.domain}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center text-center transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
        <h4 className="text-2xl font-bold font-heading mb-1">{member.name}</h4>
        <p className="text-primary-lavender font-medium mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{member.role}</p>
        
        <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
          <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-colors">
            <Linkedin className="w-5 h-5" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-colors">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-colors">
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};
