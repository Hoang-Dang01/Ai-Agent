"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const generateParticles = () => {
  return [...Array(40)].map((_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    y: [0, Math.random() * -100 - 50, 0],
    x: [0, Math.random() * 100 - 50, 0],
    opacity: [0.1, 0.8, 0.1],
    scale: [1, 1.5, 1],
    duration: Math.random() * 15 + 10,
  }));
};

export const DataParticles = ({ vibeMode }: { vibeMode: boolean }) => {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, size: number, left: string, top: string, y: number[], x: number[], opacity: number[], scale: number[], duration: number}>>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setParticles(generateParticles());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || !vibeMode) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bg-white rounded-full"
          style={{
            width: p.size,
            height: p.size,
            boxShadow: "0 0 10px rgba(255,255,255,0.8)",
            left: p.left,
            top: p.top,
          }}
          animate={{
            y: p.y,
            x: p.x,
            opacity: p.opacity,
            scale: p.scale,
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};
