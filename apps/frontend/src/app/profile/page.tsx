"use client";
import { User, Key, Shield, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage, TranslationKey } from "@/contexts/language-context";

export default function ProfilePage() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <div className="flex items-center gap-4 mb-8 border-b border-slate-800/60 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-600 flex items-center justify-center border-2 border-slate-700/50 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">{t("profile")}</h1>
            <p className="text-slate-400">{t("adminRole" as TranslationKey)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-800/60 bg-[#0F141F]/60 backdrop-blur-xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-500" />
              {t("securityInfo" as TranslationKey)}
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-3 text-slate-300">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>admin@turing-hub.ai</span>
                </div>
                <span className="text-[10px] font-bold tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">{t("verifiedBadge" as TranslationKey)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-3 text-slate-300">
                  <Key className="w-4 h-4 text-slate-500" />
                  <span>{t("passwordAuth" as TranslationKey)}</span>
                </div>
                <button className="text-[10px] font-bold tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded hover:bg-cyan-500/20 transition-colors">{t("updateBtn" as TranslationKey)}</button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/60 bg-[#0F141F]/60 backdrop-blur-xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              {t("apiAccess" as TranslationKey)}
            </h2>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-300">{t("openaiKey" as TranslationKey)}</span>
                  <span className="text-[10px] text-slate-500">{t("lastUsed" as TranslationKey)}</span>
                </div>
                <div className="font-mono text-sm text-slate-500 bg-black/40 p-2 rounded border border-slate-800/50 flex justify-between items-center">
                  <span>sk-proj-••••••••••••••••</span>
                  <button className="text-xs text-cyan-500 hover:text-cyan-400">{t("revealBtn" as TranslationKey)}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
