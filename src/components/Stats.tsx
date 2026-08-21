import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { AreaChart } from './charts/area-chart';
import { Area } from './charts/area';

const stats = [
  { value: 250, suffix: "+", label: "Active Members", desc: "Designers, developers, and creators" },
  { value: 45, suffix: "+", label: "Projects Completed", desc: "Real-world web, app & design solutions" },
  { value: 30, suffix: "+", label: "Events & Workshops", desc: "Interactive learning experiences" },
  { value: 12, suffix: "", label: "Industry Partners", desc: "Collaborating for innovation" },
];

const chartData = [
  { date: "2026-01-01", members: 30 },
  { date: "2026-02-01", members: 65 },
  { date: "2026-03-01", members: 110 },
  { date: "2026-04-01", members: 160 },
  { date: "2026-05-01", members: 210 },
  { date: "2026-06-01", members: 250 },
];

export const Stats = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section className="py-24 relative overflow-hidden bg-black/40 border-y border-white/5" ref={ref}>
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Number Counters */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-8 md:gap-12">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex flex-col"
              >
                <div className="text-4xl md:text-5xl font-extrabold font-heading text-white mb-2 flex items-baseline">
                  {isInView ? (
                    <NumberFlow value={stat.value} />
                  ) : (
                    <span>0</span>
                  )}
                  <span className="text-primary ml-1">{stat.suffix}</span>
                </div>
                <div className="text-sm font-bold tracking-wider text-white uppercase mb-1">{stat.label}</div>
                <div className="text-xs text-muted">{stat.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* Right Column: Chart */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="p-6 rounded-2xl bg-surface/40 border border-white/10 backdrop-blur-md relative"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs font-bold tracking-widest text-primary uppercase">Growth Velocity</div>
                  <div className="text-lg font-bold text-white">Community Expansion</div>
                </div>
                <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                  +120% this year
                </div>
              </div>

              <AreaChart
                data={chartData}
                xDataKey="date"
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                status={isInView ? "ready" : "loading"}
                animationDuration={1500}
                yDomainTween={true}
              >
                <Area 
                  dataKey="members" 
                  fill="url(#primary-gradient)" 
                  stroke="var(--chart-line-primary)" 
                  strokeWidth={2}
                />
              </AreaChart>

              {/* Define gradient for the area chart fill */}
              <svg style={{ width: 0, height: 0, position: 'absolute' }}>
                <defs>
                  <linearGradient id="primary-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(168, 85, 247, 0.3)" />
                    <stop offset="95%" stopColor="rgba(168, 85, 247, 0)" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          </div>
          
        </div>
      </div>
    </section>
  );
};
