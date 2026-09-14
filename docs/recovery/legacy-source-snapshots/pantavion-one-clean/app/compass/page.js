"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "../../components/ui/card";

const sections = [
  "World Map & Regions",
  "Continents & Countries",
  "Cities & Places",
  "Travel & Airports",
  "Marine & Ports",
  "Environment & Climate",
  "Culture & Heritage",
  "Health & Hospitals",
  "Education & Universities",
  "Business & Jobs",
  "Sports & Stadiums",
  "Embassies & Services",
];

export default function CompassPage() {
  return (
    <div className="min-h-screen w-full px-4 py-8 flex flex-col items-center bg-slate-950 text-slate-50">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl md:text-4xl font-bold tracking-wide mb-4 text-center"
      >
        Pantavion Compass
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-sm md:text-base text-slate-300 max-w-2xl text-center"
      >
        Explore the world through Pantavion: continents, countries, cities,
        ports, airports and key services — all in one global map.
      </motion.p>

      <div className="mt-8 grid gap-4 w-full max-w-5xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((label, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.4 }}
          >
            <Card className="h-full bg-slate-900/60 border-slate-700 hover:border-sky-400 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-center text-center">
                <span className="text-sm md:text-base font-medium">
                  {label}
                </span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
