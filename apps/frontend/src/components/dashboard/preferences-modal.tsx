"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Sparkles, Cpu } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useState } from "react";

export function PreferencesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { lang, toggleLang, vibeMode, toggleVibeMode } = useLanguage();
  const [activeTab, setActiveTab] = useState("general");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A0E17]/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div 
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl bg-[#0F141F] border border-slate-700/60 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative"
          >
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900/40 relative z-10">
              <h2 className="text-lg font-bold text-slate-200 tracking-wide">
                {lang === "vi" ? "Tùy Chỉnh Hệ Thống" : "System Preferences"}
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="flex flex-1 min-h-[400px] relative z-10">
              {/* Sidebar Tabs */}
              <div className="w-48 border-r border-slate-800/60 bg-slate-900/20 p-4 flex flex-col gap-2">
                <button 
                  onClick={() => setActiveTab("general")} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === "general" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"}`}
                >
                  <Globe className="w-4 h-4" /> {lang === "vi" ? "Chung" : "General"}
                </button>
                <button 
                  onClick={() => setActiveTab("appearance")} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === "appearance" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"}`}
                >
                  <Sparkles className="w-4 h-4" /> {lang === "vi" ? "Giao Diện" : "Appearance"}
                </button>
                <button 
                  onClick={() => setActiveTab("ai")} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === "ai" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"}`}
                >
                  <Cpu className="w-4 h-4" /> AI Engine
                </button>
              </div>
              
              {/* Content Area */}
              <div className="flex-1 p-6 bg-transparent">
                <AnimatePresence mode="wait">
                  {activeTab === "general" && (
                    <motion.div 
                      key="general"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex flex-col gap-6"
                    >
                      <div>
                        <h3 className="text-slate-200 font-semibold mb-2">Ngôn ngữ hiển thị (Language)</h3>
                        <p className="text-slate-500 text-sm mb-4">Thay đổi ngôn ngữ của toàn bộ hệ thống Ai-Agent.</p>
                        <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800/60 w-max">
                          <button 
                            onClick={lang === "en" ? toggleLang : undefined} 
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${lang === "vi" ? "bg-cyan-500/20 shadow-md text-cyan-400" : "text-slate-400 hover:text-slate-200"}`}
                          >
                            Tiếng Việt
                          </button>
                          <button 
                            onClick={lang === "vi" ? toggleLang : undefined} 
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${lang === "en" ? "bg-cyan-500/20 shadow-md text-cyan-400" : "text-slate-400 hover:text-slate-200"}`}
                          >
                            English
                          </button>
                        </div>
                      </div>
                      
                      <div className="h-px bg-slate-800/60"></div>
                      
                      <div>
                        <h3 className="text-slate-200 font-semibold mb-2">Bảo mật (Security)</h3>
                        <p className="text-slate-500 text-sm mb-4">Mức độ mã hóa dữ liệu khi gửi qua Webhook.</p>
                        <select className="w-full bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors">
                          <option>Tiêu chuẩn (Standard AES-256)</option>
                          <option>Cao cấp (Quantum-Resistant)</option>
                          <option>Nghiêm ngặt (Strict Zero-Knowledge)</option>
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "appearance" && (
                    <motion.div 
                      key="appearance"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex flex-col gap-6"
                    >
                      <div>
                        <h3 className="text-slate-200 font-semibold mb-2">Hiệu ứng Cinematic</h3>
                        <p className="text-slate-500 text-sm mb-4">Bật/tắt các hiệu ứng hạt, ánh sáng Glow và hoạt ảnh Framer Motion.</p>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-cyan-950/20 border border-cyan-900/30">
                          <span className="text-slate-300 font-medium">Chế độ tối đa (Vibe UI)</span>
                          <div 
                            onClick={toggleVibeMode}
                            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${vibeMode ? 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'bg-slate-700'}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${vibeMode ? 'right-1' : 'left-1'}`}></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "ai" && (
                    <motion.div 
                      key="ai"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex flex-col gap-6"
                    >
                      <div>
                        <h3 className="text-slate-200 font-semibold mb-2">Mô hình Mặc định (Default Model)</h3>
                        <select className="w-full bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors">
                          <option>GPT-4o (OpenAI)</option>
                          <option>Claude 3.5 Sonnet (Anthropic)</option>
                          <option>Llama 3 70B (Local Ollama)</option>
                        </select>
                      </div>
                      <div>
                        <h3 className="text-slate-200 font-semibold mb-2">Độ sáng tạo (Temperature)</h3>
                        <p className="text-slate-500 text-sm mb-4">Kiểm soát mức độ ngẫu nhiên của câu trả lời.</p>
                        <input type="range" min="0" max="100" defaultValue="70" className="w-full accent-cyan-500" />
                        <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                          <span>0.0 (Chính xác)</span>
                          <span>0.7 (Cân bằng)</span>
                          <span>1.0 (Sáng tạo)</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
