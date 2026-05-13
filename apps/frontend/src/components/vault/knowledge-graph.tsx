"use client";
import { motion } from "framer-motion";
import { Cpu, Sparkles } from "lucide-react";

export function KnowledgeGraph3D({ vibeMode }: { vibeMode: boolean }) {
  return (
    <div className="flex-1 relative overflow-hidden bg-[#05080f] flex items-center justify-center min-h-[300px] lg:min-h-[500px]">
      {/* Fake 3D Graph Nodes using Framer Motion */}
      <div className="absolute inset-0 flex items-center justify-center scale-50 sm:scale-75 md:scale-90 lg:scale-100">
        {/* Central Core Node */}
        <motion.div 
          animate={vibeMode ? { boxShadow: ["0 0 20px rgba(16,185,129,0.4)", "0 0 60px rgba(16,185,129,0.8)", "0 0 20px rgba(16,185,129,0.4)"] } : { boxShadow: "0 0 20px rgba(16,185,129,0.4)" }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center z-20 relative"
        >
          <Cpu className="w-8 h-8 text-emerald-400" />
          <div className="absolute -bottom-8 text-xs font-mono text-emerald-400 font-bold bg-black/50 px-2 py-1 rounded backdrop-blur">CORE_LLM</div>
        </motion.div>

        {/* Orbiting Satellite Nodes (3 Rings) */}
        {[...Array(24)].map((_, i) => {
          const ring = i % 3; // 3 vòng quỹ đạo: 0 (trong), 1 (giữa), 2 (ngoài)
          const radius = ring === 0 ? 110 : ring === 1 ? 190 : 280;
          const itemsInRing = ring === 0 ? 6 : ring === 1 ? 8 : 10;
          const baseAngle = (i % itemsInRing) * (360 / itemsInRing);
          const offsetAngle = ring * 15; // Lệch pha giữa các vòng
          const angle = (baseAngle + offsetAngle) * (Math.PI / 180);
          
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          // Các node vòng ngoài cùng sẽ nhỏ hơn và mờ hơn
          const nodeSize = ring === 0 ? "w-8 h-8" : ring === 1 ? "w-6 h-6" : "w-4 h-4";
          const dotSize = ring === 0 ? "w-2 h-2" : "w-1.5 h-1.5";
          const lineOpacity = ring === 0 ? 0.6 : ring === 1 ? 0.3 : 0.1;

          return (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ x, y, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.05, duration: 1.5, type: "spring", stiffness: 50 }}
              className="absolute z-10"
            >
              {/* Đường Line kết nối về Core */}
              <svg className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ transform: `translate(-50%, -50%) rotate(${baseAngle + offsetAngle + 180}deg)` }}>
                <motion.line 
                  x1="50%" y1="50%" x2="50%" y2="0" 
                  stroke={`url(#emerald-gradient-${ring})`} 
                  strokeWidth={ring === 0 ? "1.5" : "1"} 
                  strokeDasharray={ring === 2 ? "2 6" : "4 4"}
                  animate={vibeMode ? { strokeDashoffset: [0, -20] } : {}}
                  transition={{ duration: ring === 0 ? 1 : ring === 1 ? 2 : 3, repeat: Infinity, ease: "linear" }}
                />
                <defs>
                  <linearGradient id={`emerald-gradient-${ring}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(16,185,129,0)" />
                    <stop offset="100%" stopColor={`rgba(16,185,129,${lineOpacity})`} />
                  </linearGradient>
                </defs>
              </svg>

              {/* Node */}
              <div className={`${nodeSize} rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center relative group cursor-pointer hover:border-emerald-400 hover:bg-emerald-950/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.6)] transition-all duration-300 hover:scale-125 z-20`}>
                <div className={`${dotSize} bg-slate-500 rounded-full group-hover:bg-emerald-400 transition-colors shadow-[0_0_5px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_8px_rgba(16,185,129,1)]`}></div>
                
                {/* Tooltip khi Hover */}
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-xs text-slate-300 px-3 py-1.5 border border-emerald-500/50 rounded-lg backdrop-blur shadow-xl pointer-events-none whitespace-nowrap z-50">
                  <div className="font-bold text-emerald-400 mb-0.5">Vector Chunk_{i}</div>
                  <div className="text-[10px] text-slate-400">Score: {(0.99 - (ring * 0.1) - (i * 0.01)).toFixed(2)}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Info Overlay */}
      <div className="absolute bottom-6 right-6 hidden sm:flex flex-col gap-2 pointer-events-none">
        <div className="bg-[#0A0E17]/80 backdrop-blur border border-emerald-900/50 rounded-xl p-4 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">RAG Engine Status</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 gap-8">
              <span>Total Vectors:</span>
              <span className="font-mono text-white">2,140,551</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 gap-8">
              <span>Embedding Model:</span>
              <span className="font-mono text-white">nomic-embed-text</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 gap-8">
              <span>Similarity Threshold:</span>
              <span className="font-mono text-emerald-400">0.85</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
