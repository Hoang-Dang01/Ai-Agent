"use client";
import { Database, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

export function RAGMonitoring() {
  const { t } = useLanguage();
  const nodes = [
    { top: "20%", left: "25%", size: 10, color: "bg-cyan-400", shadow: "shadow-[0_0_30px_rgba(34,211,238,0.8)]" },
    { top: "40%", left: "55%", size: 12, color: "bg-cyan-500", shadow: "shadow-[0_0_35px_rgba(6,182,212,0.8)]" },
    { top: "80%", left: "20%", size: 6, color: "bg-cyan-300", shadow: "shadow-[0_0_20px_rgba(103,232,249,0.8)]" },
    { top: "80%", left: "45%", size: 8, color: "bg-cyan-400", shadow: "shadow-[0_0_25px_rgba(34,211,238,0.8)]" },
    { top: "50%", left: "80%", size: 7, color: "bg-cyan-300", shadow: "shadow-[0_0_25px_rgba(103,232,249,0.8)]" },
  ];

  return (
    <div className="flex-1 rounded-2xl border border-slate-800/60 bg-[#0F141F]/60 backdrop-blur-xl flex flex-col shadow-lg overflow-hidden min-h-[400px]">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800/60 bg-slate-900/20">
        <Database className="w-4 h-4 text-cyan-500" />
        <h2 className="text-slate-200 font-semibold tracking-wide">{t("ragMonitoring")}</h2>
      </div>
      
      {/* Glowing Nodes Visualization */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-hidden bg-black/20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative w-56 h-48 z-10">
           {/* SVG Lines */}
           <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 100 100">
              <line x1="30" y1="30" x2="60" y2="50" stroke="#06b6d4" strokeWidth="1" />
              <line x1="30" y1="30" x2="25" y2="80" stroke="#06b6d4" strokeWidth="1" />
              <line x1="60" y1="50" x2="80" y2="60" stroke="#06b6d4" strokeWidth="1" />
              <line x1="60" y1="50" x2="50" y2="80" stroke="#06b6d4" strokeWidth="1" />
              <line x1="25" y1="80" x2="50" y2="80" stroke="#06b6d4" strokeWidth="1" />
              <line x1="50" y1="80" x2="80" y2="60" stroke="#06b6d4" strokeWidth="1" />
           </svg>
           {/* Nodes with Animation */}
           {nodes.map((node, i) => (
             <motion.div
               key={i}
               animate={{ 
                 y: [0, -8, 0], 
                 scale: [1, 1.1, 1],
                 opacity: [0.7, 1, 0.7]
               }}
               transition={{ 
                 repeat: Infinity, 
                 duration: 3 + i * 0.5, 
                 ease: "easeInOut",
                 delay: i * 0.2
               }}
               className={`absolute rounded-full border border-white/20 ${node.color} ${node.shadow}`}
               style={{ 
                 top: node.top, 
                 left: node.left, 
                 width: `${node.size}px`, 
                 height: `${node.size}px`,
                 transform: "translate(-50%, -50%)" 
               }}
             />
           ))}
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-6 pb-6 pt-4 bg-slate-900/30 border-t border-slate-800/60">
        <div className="bg-[#0A0E17]/80 rounded-xl p-3 text-center border border-slate-800/40 shadow-inner">
          <div className="flex items-center justify-center gap-1.5 text-cyan-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">
            <Activity className="w-3 h-3" /> {t("hits")}
          </div>
          <div className="text-slate-100 font-bold text-lg">1,247</div>
        </div>
        <div className="bg-[#0A0E17]/80 rounded-xl p-3 text-center border border-slate-800/40 shadow-inner">
          <div className="flex items-center justify-center gap-1.5 text-emerald-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">
            <Database className="w-3 h-3" /> {t("graph")}
          </div>
          <div className="text-slate-100 font-bold text-lg">89%</div>
        </div>
        <div className="bg-[#0A0E17]/80 rounded-xl p-3 text-center border border-slate-800/40 shadow-inner">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">
            <Activity className="w-3 h-3" /> {t("latency")}
          </div>
          <div className="text-slate-100 font-bold text-lg">12ms</div>
        </div>
      </div>
    </div>
  );
}
