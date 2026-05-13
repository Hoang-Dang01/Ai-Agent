"use client";
import { Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language-context";

const mockLogs = [
  "[System] Initializing Vibe Engine v2.0...",
  "[MC-Bot] Connection established with Minecraft server.",
  "[MC-Bot] Executing pathfinding algorithm -> ETA 4.2s",
  "[RAG] Vector DB loaded 12,400 chunks.",
  "[CV-Agent] YOLOv8 model loaded. Confidence threshold: 0.85"
];

export function LiveThoughtStream() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < mockLogs.length) {
        setLogs(prev => [...prev, mockLogs[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="col-span-8 rounded-2xl border border-slate-800/60 bg-[#0F141F]/60 backdrop-blur-xl flex flex-col shadow-lg overflow-hidden relative">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900/20 z-10">
        <div className="flex items-center gap-3">
          <span className="text-cyan-500 font-mono text-lg font-bold">{`>_`}</span>
          <h2 className="text-slate-200 font-semibold tracking-wide">{t("liveThoughtStream")}</h2>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          <span className="text-emerald-500 text-[11px] font-bold uppercase tracking-widest">{t("live")}</span>
        </div>
      </div>
      
      <div className="p-6 flex-1 font-mono text-sm bg-black/20 overflow-y-auto z-10 flex flex-col gap-3">
        <AnimatePresence>
          {logs.filter(log => typeof log === "string").map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              transition={{ duration: 0.4 }}
              className="flex items-start gap-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50"
            >
              <span className="text-slate-500 shrink-0">
                {new Date().toLocaleTimeString('en-US', { hour12: false })}
              </span>
              <div className="flex gap-2 text-slate-300">
                {log.includes("[MC-Bot]") && <Activity className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />}
                <span dangerouslySetInnerHTML={{ __html: log.replace(/\[(.*?)\]/g, '<span class="text-cyan-400">[$1]</span>') }} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="mt-2 flex items-center gap-2 px-3">
          <motion.div 
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            className="w-2.5 h-5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
          />
        </div>
      </div>
    </div>
  );
}
