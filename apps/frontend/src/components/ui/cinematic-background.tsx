"use client";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

export function CinematicBackground() {
  const { vibeMode } = useLanguage();

  if (!vibeMode) return null;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#02040A] pointer-events-none">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 w-full h-full mix-blend-screen"
        style={{
          backgroundImage: "url('/bg-cyberpunk.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.7) contrast(1.2)",
        }}
      />
      {/* Overlay gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E17] via-[#0A0E17]/60 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E17]/90 via-transparent to-[#0A0E17]/80"></div>
    </div>
  );
}
