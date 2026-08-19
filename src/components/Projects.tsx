import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

const projects = [
  {
    id: 1,
    title: "IARE Connect",
    category: "Web App",
    year: "2025",
    description: "A comprehensive student portal for networking, resource sharing, and event management.",
    span: "md:col-span-8",
    color: "bg-zinc-800"
  },
  {
    id: 2,
    title: "EcoVision",
    category: "AI / Design",
    year: "2025",
    description: "Computer vision application for waste sorting, featuring an award-winning accessible interface.",
    span: "md:col-span-4",
    color: "bg-zinc-900"
  },
  {
    id: 3,
    title: "e-DAM Rebrand",
    category: "Visual Identity",
    year: "2026",
    description: "Complete visual identity overhaul including custom typography, motion guidelines, and 3D assets.",
    span: "md:col-span-5",
    color: "bg-zinc-900"
  },
  {
    id: 4,
    title: "Lumina Engine",
    category: "Creative Coding",
    year: "2026",
    description: "Open-source WebGL renderer built specifically for creating interactive web exhibitions.",
    span: "md:col-span-7",
    color: "bg-zinc-800"
  }
];

export const Projects = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section id="projects" className="py-24 relative" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div 
          className="mb-16 md:mb-24 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-sm font-bold tracking-[0.2em] text-primary uppercase mb-4">Selected Work</h2>
          <h3 className="text-4xl md:text-5xl font-bold">FEATURED PROJECTS</h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ProjectCard = ({ project, index, isInView }: { project: typeof projects[0], index: number, isInView: boolean }) => {
  return (
    <motion.div 
      className={`group relative overflow-hidden rounded-3xl ${project.span} min-h-[400px] flex flex-col justify-end p-8 border border-white/5 cursor-pointer`}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay: index * 0.15 }}
    >
      {/* Background with subtle animation */}
      <div className={`absolute inset-0 ${project.color} transition-transform duration-700 group-hover:scale-105 -z-10`} />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent -z-10" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent transition-opacity duration-500 -z-10" />

      {/* Top Meta */}
      <div className="absolute top-8 left-8 flex gap-3">
        <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold tracking-widest uppercase">
          {project.category}
        </span>
        <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold tracking-widest">
          {project.year}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
        <h4 className="text-3xl font-heading font-bold mb-3">{project.title}</h4>
        <p className="text-white/70 max-w-lg mb-6 line-clamp-2 group-hover:text-white transition-colors">
          {project.description}
        </p>
        
        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 delay-100">
          <ArrowUpRight className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
};
