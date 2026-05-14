"use client";
import { Settings, Database, Cpu, Network, LayoutGrid, BookOpen, FlaskConical, Blocks, User, UserCircle, Command, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage, TranslationKey } from "@/contexts/language-context";

import { PreferencesModal } from "@/components/dashboard/preferences-modal";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPrefOpen, setIsPrefOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: { icon: React.ElementType, labelKey: TranslationKey, href: string }[] = [
    { icon: LayoutGrid, labelKey: "workspace", href: "/" },
    { icon: BookOpen, labelKey: "studyHub", href: "/study-hub" },
    { icon: Network, labelKey: "modelLab", href: "/model-lab" },
    { icon: Cpu, labelKey: "aiEngines", href: "/ai-engines" },
    { icon: Database, labelKey: "theVault", href: "/vault" },
    { icon: Blocks, labelKey: "integrations", href: "/integrations" },
    { icon: FlaskConical, labelKey: "experiments", href: "/experiments" },
  ];

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{ overflow: "visible" }}
      className="border-r border-slate-800/60 bg-[#0F141F] flex flex-col justify-between shadow-2xl z-[100] relative"
    >
      {/* Toggle Button positioned outside overflow-hidden */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-5 w-6 h-6 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors z-30 shadow-lg"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <div className="overflow-hidden">
        {/* Logo */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} border-b border-slate-800/60 relative`}>
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <motion.div 
              whileHover={{ 
                scale: 1.05
              }}
              className="w-8 h-8 rounded-[6px] flex items-center justify-center transition-all duration-300"
            >
              {/* CSS Magic: mix-blend-screen + invert sẽ biến cái ảnh nền trắng chữ đen thành nền trong suốt chữ trắng! */}
              <Image 
                src="/logo.png" 
                alt="Turing Hub Logo" 
                width={28}
                height={28}
                className="object-contain grayscale contrast-[500%] invert mix-blend-screen group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300" 
              />
            </motion.div>
            {!isCollapsed && <span className="text-white font-bold tracking-wide text-[17px] group-hover:text-white transition-colors duration-300 whitespace-nowrap">Turing Hub</span>}
          </motion.div>
        </div>
        
        {/* Nav Items */}
        <nav className={`p-4 flex flex-col gap-1.5 mt-2 ${isCollapsed ? 'items-center' : ''}`}>
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            
            if (isActive) {
              return (
                <Link href={item.href} key={idx} title={isCollapsed ? t(item.labelKey) : undefined} className={`flex items-center ${isCollapsed ? 'justify-center w-12 h-12' : 'gap-3 px-4'} py-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.05)] relative overflow-hidden shrink-0`}>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  />
                  <item.icon className="w-5 h-5 relative z-10 shrink-0" />
                  {!isCollapsed && <span className="font-semibold text-sm relative z-10 whitespace-nowrap">{t(item.labelKey)}</span>}
                </Link>
              );
            }

            return (
              <Link href={item.href} key={idx} title={isCollapsed ? t(item.labelKey) : undefined} className={`group flex items-center ${isCollapsed ? 'justify-center w-12 h-12' : 'gap-3 px-4'} py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl cursor-pointer transition-all shrink-0`}>
                <item.icon className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-transform shrink-0" />
                {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{t(item.labelKey)}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Bottom Popup Menu */}
      <div className="p-4 border-t border-slate-800/60 relative">
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Overlay để click ra ngoài đóng Menu */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsMenuOpen(false)} 
              />
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full mb-2 py-2 rounded-xl border border-slate-700/80 bg-[#0A0E17]/95 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 flex flex-col min-w-[200px] left-4"
              >
              <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="px-4 py-2.5 flex items-center justify-between text-slate-300 hover:bg-slate-800/50 cursor-pointer transition-colors group">
                <span className="text-[13px] font-medium">{t("profile")}</span>
                <UserCircle className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </Link>
              <Link href="/shortcuts" onClick={() => setIsMenuOpen(false)} className="px-4 py-2.5 flex items-center justify-between text-slate-300 hover:bg-slate-800/50 cursor-pointer transition-colors group">
                <span className="text-[13px] font-medium">{t("shortcuts")}</span>
                <Command className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </Link>
              <Link href="/docs" onClick={() => setIsMenuOpen(false)} className="px-4 py-2.5 flex items-center justify-between text-slate-300 hover:bg-slate-800/50 cursor-pointer transition-colors group">
                <span className="text-[13px] font-medium">{t("help")}</span>
                <BookOpen className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </Link>
              <div className="h-px bg-slate-700/80 my-1"></div>
              <div 
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsPrefOpen(true);
                }} 
                className="px-4 py-2.5 flex items-center justify-between text-cyan-400 hover:bg-cyan-950/30 cursor-pointer transition-colors"
              >
                <span className="text-[13px] font-medium">{t("preferences")}</span>
                <Settings className="w-4 h-4 text-cyan-500" />
              </div>
            </motion.div>
            </>
          )}
        </AnimatePresence>

        <div 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          title={isCollapsed ? t("admin") : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'justify-between px-3'} py-2.5 rounded-xl cursor-pointer transition-colors border ${isMenuOpen ? 'bg-slate-800/50 border-slate-700' : 'hover:bg-slate-800/30 border-transparent'}`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-600 flex items-center justify-center border border-slate-700 shadow-inner shrink-0">
              <User className="w-4 h-4 text-white shrink-0" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col shrink-0">
                <span className="text-sm font-bold text-slate-200 leading-tight whitespace-nowrap">{t("admin")}</span>
                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">Turing Hub</span>
              </div>
            )}
          </div>
          {!isCollapsed && <Settings className={`w-4 h-4 text-slate-500 transition-transform duration-300 shrink-0 ${isMenuOpen ? 'rotate-90 text-cyan-400' : ''}`} />}
        </div>
      </div>

      <PreferencesModal isOpen={isPrefOpen} onClose={() => setIsPrefOpen(false)} />
    </motion.aside>
  );
}
