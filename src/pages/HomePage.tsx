import React from "react";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Domains } from "@/components/Domains";
import { Stats } from "@/components/Stats";
import { Events } from "@/components/Events";
import { Projects } from "@/components/Projects";
import { Team } from "@/components/Team";
import { JoinCTA } from "@/components/JoinCTA";

export const HomePage: React.FC = () => {
  return (
    <div className="relative">
      <Hero />
      <About />
      <Domains />
      <Stats />
      <Events />
      <Projects />
      <Team />
      <JoinCTA />
    </div>
  );
};

