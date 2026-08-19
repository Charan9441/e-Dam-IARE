import { useState } from 'react';
import { motion } from 'motion/react';
import { LogoLoader } from './components/LogoLoader';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Domains } from './components/Domains';
import { Stats } from './components/Stats';
import { Events } from './components/Events';
import { Projects } from './components/Projects';
import { Team } from './components/Team';
import { JoinCTA } from './components/JoinCTA';
import { Footer } from './components/Footer';

function App() {
  const [loading, setLoading] = useState(true);
  const [isZoomingIn, setIsZoomingIn] = useState(false);

  return (
    <div className="min-h-screen bg-[#030305] text-[#F5F3FF] selection:bg-[#8B5CF6]/30">
      {loading && (
        <LogoLoader 
          onZoomStart={() => setIsZoomingIn(true)}
          onComplete={() => {
            setLoading(false);
            setIsZoomingIn(false);
          }} 
        />
      )}
      
      {(!loading || isZoomingIn) && (
        <motion.main 
          className="relative z-10"
          initial={{ scale: 1.08, filter: 'blur(12px)', opacity: 0.8 }}
          animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Navbar />
          <Hero />
          <About />
          <Domains />
          <Stats />
          <Events />
          <Projects />
          <Team />
          <JoinCTA />
          <Footer />
        </motion.main>
      )}
    </div>
  );
}

export default App;
