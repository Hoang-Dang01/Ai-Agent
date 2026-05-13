"use client";
import { Blocks, CheckCircle2, CircleDashed } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

export function MasterPlanWidget() {
  const { t } = useLanguage();

  return (
    <div className="h-44 rounded-2xl border border-slate-800/60 bg-[#0F141F]/60 backdrop-blur-xl p-6 flex flex-col shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
            <Blocks className="w-4 h-4 text-amber-500" />
          </div>
          <h2 className="text-slate-200 font-semibold tracking-wide">{t("masterPlan")}</h2>
        </div>
        <span className="text-slate-500 font-mono text-xs font-bold bg-slate-900/50 px-2 py-1 rounded border border-slate-800">2/5</span>
      </div>
      
      <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden mb-5 relative z-10 shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "40%" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"
        />
      </div>
      
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto relative z-10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.3)] rounded-full" />
          <span className="text-slate-300 text-sm font-medium">{t("phase1")}</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent">
          <CircleDashed className="w-4 h-4 text-slate-600 shrink-0" />
          <span className="text-slate-500 text-sm font-medium">{t("phase2")}</span>
        </div>
      </div>
    </div>
  );
}
