"use client";
import { Command, Terminal, Search, Settings, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage, TranslationKey } from "@/contexts/language-context";

export default function ShortcutsPage() {
  const { t } = useLanguage();

  const shortcuts = [
    { icon: Search, labelKey: "globalSearch", keys: ["⌘", "K"] },
    { icon: Terminal, labelKey: "openCli", keys: ["⌘", "J"] },
    { icon: Settings, labelKey: "sysPrefs", keys: ["⌘", ","] },
    { icon: ShieldAlert, labelKey: "killSwitch", keys: ["⇧", "⌘", "Q"], color: "text-rose-500" },
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="flex items-center gap-4 border-b border-slate-800/60 pb-6">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
            <Command className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">{t("shortcuts")}</h1>
            <p className="text-slate-400">{t("shortcutsDesc" as TranslationKey)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shortcuts.map((sc, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-800/60 bg-[#0F141F]/60 backdrop-blur-xl hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <sc.icon className={`w-5 h-5 ${sc.color || "text-slate-400"}`} />
                <span className="font-medium text-slate-200">{t(sc.labelKey as TranslationKey)}</span>
              </div>
              <div className="flex gap-1.5">
                {sc.keys.map((k, j) => (
                  <kbd key={j} className="min-w-[28px] h-7 px-2 flex items-center justify-center font-sans text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-md shadow-[0_2px_0_rgba(255,255,255,0.05)]">
                    {k}
                  </kbd>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
