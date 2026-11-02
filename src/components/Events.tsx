import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'motion/react';
import { ArrowUpRight, Calendar } from 'lucide-react';
import { EDAM_EVENTS } from '@/data/edam-data';

export const Events = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  const events = EDAM_EVENTS.slice(0, 4);

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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD] text-xs font-semibold uppercase tracking-widest mb-4">
              <Calendar className="w-3.5 h-3.5 text-[#A855F7]" />
              <span>What's Next</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight font-heading">UPCOMING EVENTS</h3>
          </div>
          <Link
            to="/events"
            className="text-[#8B5CF6] hover:text-white transition-colors flex items-center gap-2 pb-2 border-b border-[#8B5CF6]/30 hover:border-white font-semibold text-sm"
          >
            <span>View All Events &amp; Workshops</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
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

const EventRow = ({ event, index, isInView }: { event: typeof EDAM_EVENTS[0], index: number, isInView: boolean }) => {
  return (
    <Link to={`/events/${event.slug}`}>
      <motion.div 
        className="group relative flex flex-col md:flex-row gap-6 md:gap-12 py-10 md:py-12 border-b border-white/10 hover:border-[#8B5CF6]/50 transition-colors cursor-pointer"
        initial={{ opacity: 0, x: -20 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/10 via-[#8B5CF6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10" />

        <div className="w-full md:w-1/4 flex flex-col justify-center">
          <div className="text-[#8B5CF6] text-xs font-bold tracking-widest uppercase mb-2">{event.category}</div>
          <div className="text-2xl font-light text-white/70 group-hover:text-white transition-colors">{event.date}</div>
        </div>

        <div className="w-full md:w-2/4 flex flex-col justify-center">
          <h4 className="text-2xl md:text-3xl font-heading font-bold mb-3 group-hover:text-[#C4B5FD] transition-colors">{event.title}</h4>
          <p className="text-[#928A9F] text-sm md:text-base line-clamp-2 leading-relaxed">{event.tagline || event.description}</p>
        </div>

        <div className="w-full md:w-1/4 flex items-center md:justify-end">
          <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-[#8B5CF6] group-hover:border-[#8B5CF6] group-hover:-rotate-45 transition-all duration-300">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
