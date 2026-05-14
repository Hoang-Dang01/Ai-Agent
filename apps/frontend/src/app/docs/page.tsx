"use client";
import { BookOpen, FileText, Database, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage, TranslationKey } from "@/contexts/language-context";

export default function DocsPage() {
  const { t } = useLanguage();

  const docs = [
    { icon: Zap, titleKey: "obsManual", descKey: "obsDesc", tag: "P1" },
    { icon: Database, titleKey: "ragCaps", descKey: "ragDesc", tag: "P1" },
    { icon: ShieldCheck, titleKey: "corePhysics", descKey: "coreDesc", tag: "P0" },
    { icon: FileText, titleKey: "agentRoles", descKey: "agentDesc", tag: "P2" },
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-8"
      >
        <div className="flex items-center gap-4 border-b border-slate-800/60 pb-6">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <BookOpen className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">{t("help")}</h1>
            <p className="text-slate-400">{t("docsDesc" as TranslationKey)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {docs.map((doc, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="group cursor-pointer p-6 rounded-2xl border border-slate-800/60 bg-[#0F141F]/60 backdrop-blur-xl hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 group-hover:bg-cyan-950/30 group-hover:border-cyan-800 transition-colors">
                  <doc.icon className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded tracking-wider bg-slate-800 border border-slate-700 ${doc.tag === 'P0' ? 'text-rose-400' : 'text-slate-400'}`}>
                  {doc.tag} TIER
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-2 group-hover:text-cyan-400 transition-colors">{t(doc.titleKey as TranslationKey)}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{t(doc.descKey as TranslationKey)}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
