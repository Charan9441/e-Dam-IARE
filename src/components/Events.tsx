import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

const events = [
  {
    id: 1,
    title: "Design Sprint 2026",
    date: "Mar 15, 2026",
    category: "Design",
    description: "A 48-hour intensive UI/UX design challenge focused on solving real-world accessibility issues."
  },
  {
    id: 2,
    title: "Creative Coding Workshop",
    date: "Apr 02, 2026",
    category: "Development",
    description: "Learn how to use Three.js and WebGL to create stunning interactive web experiences."
  },
  {
    id: 3,
    title: "Branding Bootcamp",
    date: "Apr 18, 2026",
    category: "Marketing",
    description: "Master the art of visual storytelling and brand strategy with industry experts."
  },
  {
    id: 4,
    title: "e-DAM Hackathon",
    date: "May 10, 2026",
    category: "All Domains",
    description: "Our flagship annual event where designers, developers, and marketers build full products in 3 days."
  }
];

export const Events = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section id="events" className="py-28 relative" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div 
          className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cosmic Expeditions</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight">UPCOMING EVENTS</h3>
          </div>
          <a href="#join" className="text-primary hover:text-white transition-colors flex items-center gap-2 pb-2 border-b border-primary/30 hover:border-white font-semibold">
            <span>View All Expeditions</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </motion.div>

        <div className="flex flex-col border-t border-white/10">
          {events.map((event, index) => (
            <EventRow key={event.id} event={event} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
};

const EventRow = ({ event, index, isInView }: { event: typeof events[0], index: number, isInView: boolean }) => {
  return (
    <motion.div 
      className="group relative flex flex-col md:flex-row gap-6 md:gap-12 py-10 md:py-12 border-b border-white/10 hover:border-primary/50 transition-colors cursor-pointer"
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      {/* Hover Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10" />

      <div className="w-full md:w-1/4 flex flex-col justify-center">
        <div className="text-primary text-sm font-bold tracking-widest uppercase mb-2">{event.category}</div>
        <div className="text-2xl font-light text-white/70 group-hover:text-white transition-colors">{event.date}</div>
      </div>

      <div className="w-full md:w-2/4 flex flex-col justify-center">
        <h4 className="text-3xl md:text-4xl font-heading font-bold mb-4 group-hover:text-primary-lavender transition-colors">{event.title}</h4>
        <p className="text-muted text-lg">{event.description}</p>
      </div>

      <div className="w-full md:w-1/4 flex items-center md:justify-end">
        <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:-rotate-45 transition-all duration-300">
          <ArrowUpRight className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
};
