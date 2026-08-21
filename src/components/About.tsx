import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

const pillars = [
  {
    id: "01",
    title: "Learn by building",
    desc: "No lecture-only tracks. Every workshop ends with something shipped, not just slides."
  },
  {
    id: "02",
    title: "Cross-domain by default",
    desc: "Designers work with developers, developers work with marketers — teams mirror how real products actually get made."
  },
  {
    id: "03",
    title: "Portfolio over paperwork",
    desc: "Every project you touch here is something you can point to later — case studies, repos, and real credit."
  }
];

export const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <section id="about" className="py-24 relative overflow-hidden" ref={ref}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          <div className="flex flex-col gap-8">
            <motion.h2
              className="text-4xl md:text-5xl font-extrabold leading-tight text-[#F5F3FF]"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              MORE THAN A CLUB.<br />
              <span className="font-heading italic font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#C4B5FD]">
                A creative tech community.
              </span>
            </motion.h2>

            <div className="flex flex-col gap-6 text-lg text-[#928A9F]">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              >
                e-DAM (e-Designing and Marketing) is IARE's student-run community for design, development, and digital marketing. We're developers, designers, and marketers who'd rather build something real than sit through another slide deck.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              >
                We run workshops, ship projects, and put on events across four domains — UI/UX, web & mobile development, digital marketing, and media production. If you want to learn by doing, this is where that happens.
              </motion.p>
            </div>
          </div>

          <div className="flex flex-col">
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.id}
                className="group flex gap-6 py-7 border-b border-white/10 first:border-t"
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.12, ease: "easeOut" }}
              >
                <span className="font-heading text-3xl text-primary/40 group-hover:text-primary transition-colors duration-300 shrink-0 pt-0.5">
                  {pillar.id}
                </span>
                <div>
                  <h4 className="text-xl font-bold text-[#F5F3FF] mb-2">{pillar.title}</h4>
                  <p className="text-[#928A9F] leading-relaxed">{pillar.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};
