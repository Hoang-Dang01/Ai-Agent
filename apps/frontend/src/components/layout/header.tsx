"use client";
import { Activity, Cpu, Database, Search, Bell, Sun, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  const { lang, toggleLang, t, vibeMode, toggleVibeMode } = useLanguage();

  return (
    <header className="h-16 border-b border-slate-800/60 bg-[#0A0E17]/80 backdrop-blur-xl flex items-center justify-between px-8 z-10 sticky top-0">
      <div className="flex items-center gap-8 text-sm font-medium">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span className="text-slate-500">{t("systemHealth")}</span>
          <span className="text-emerald-500">{t("optimal")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-500" />
          <span className="text-slate-500">{t("activeAgents")}</span>
          <span className="text-cyan-500">5</span>
        </div>
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-500" />
          <span className="text-slate-500">{t("gpuLoad")}</span>
          <span className="text-amber-500">67%</span>
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        <Search onClick={() => alert('Search feature requires VectorDB ingestion (Phase 6)')} className="w-5 h-5 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors" />
        <div className="relative" onClick={() => alert('No new notifications')}>
          <Bell className="w-5 h-5 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#0A0E17]"></span>
        </div>
        
        {/* Language Toggle */}
        <motion.button 
          onClick={toggleLang}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/50 text-slate-300 text-xs font-bold hover:bg-slate-700/50 transition-colors ml-2 uppercase tracking-widest"
        >
          <Globe className="w-4 h-4 text-slate-400" />
          {lang === "en" ? "EN" : "VN"}
        </motion.button>

        <motion.button 
          onClick={toggleVibeMode}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium transition-colors ml-1 ${vibeMode ? 'bg-cyan-950/40 border-cyan-800/50 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:bg-cyan-900/40' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-700/50'}`}
        >
          <Sun className="w-4 h-4" />
          {vibeMode ? 'Vibe UI' : 'Clean UI'}
        </motion.button>
      </div>
    </header>
  );
}
