"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Sparkles, Cpu } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useState } from "react";

export function PreferencesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { lang, toggleLang, vibeMode, toggleVibeMode, themeColor, setThemeColor, fontFamily, setFontFamily, textSize, setTextSize, uiStyle, setUiStyle, themeMode, setThemeMode } = useLanguage();
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
                        <h3 className="text-slate-200 font-semibold mb-2">Chủ đề (Theme Mode)</h3>
                        <p className="text-slate-500 text-sm mb-4">Đổi màu nền giao diện sang Đen (Dark) hoặc Trắng (Light).</p>
                        <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800/60 w-max">
                          <button 
                            onClick={() => setThemeMode("dark")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${themeMode === "dark" ? "bg-cyan-500/20 shadow-md text-cyan-400" : "text-slate-400 hover:text-slate-200"}`}
                          >
                            Dark Mode (Vibe)
                          </button>
                          <button 
                            onClick={() => setThemeMode("light")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${themeMode === "light" ? "bg-cyan-500/20 shadow-md text-cyan-400" : "text-slate-400 hover:text-slate-200"}`}
                          >
                            Light Mode
                          </button>
                        </div>
                      </div>

                      <div className="h-px bg-slate-800/60"></div>

                      <div>
                        <h3 className="text-slate-200 font-semibold mb-2">Màu chủ đạo (Primary Color)</h3>
                        <p className="text-slate-500 text-sm mb-4">Tùy chỉnh tông màu chính cho các nút bấm và hiệu ứng viền.</p>
                        <div className="flex items-center gap-5">
                          {/* Cyan (Default) */}
                          <div onClick={() => setThemeColor("cyan")} className="flex flex-col items-center gap-2 cursor-pointer group">
                            <div className={`w-8 h-8 rounded-full bg-[#06b6d4] transition-all ${themeColor === "cyan" ? "ring-2 ring-[#06b6d4]/50 ring-offset-2 ring-offset-[#0A0E17] shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "border border-slate-700 opacity-60 group-hover:opacity-100"}`}></div>
                            <span className={`text-[11px] font-medium transition-colors ${themeColor === "cyan" ? "text-[#22d3ee]" : "text-slate-500 group-hover:text-[#22d3ee]"}`}>Cyan</span>
                          </div>
                          
                          {/* Emerald */}
                          <div onClick={() => setThemeColor("emerald")} className="flex flex-col items-center gap-2 cursor-pointer group">
                            <div className={`w-8 h-8 rounded-full bg-emerald-500 transition-all ${themeColor === "emerald" ? "ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-[#0A0E17] shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "border border-slate-700 opacity-60 group-hover:opacity-100"}`}></div>
                            <span className={`text-[11px] font-medium transition-colors ${themeColor === "emerald" ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-400"}`}>Emerald</span>
                          </div>

                          {/* Violet */}
                          <div onClick={() => setThemeColor("violet")} className="flex flex-col items-center gap-2 cursor-pointer group">
                            <div className={`w-8 h-8 rounded-full bg-violet-500 transition-all ${themeColor === "violet" ? "ring-2 ring-violet-500/50 ring-offset-2 ring-offset-[#0A0E17] shadow-[0_0_15px_rgba(139,92,246,0.4)]" : "border border-slate-700 opacity-60 group-hover:opacity-100"}`}></div>
                            <span className={`text-[11px] font-medium transition-colors ${themeColor === "violet" ? "text-violet-400" : "text-slate-500 group-hover:text-violet-400"}`}>Violet</span>
                          </div>

                          {/* Rose */}
                          <div onClick={() => setThemeColor("rose")} className="flex flex-col items-center gap-2 cursor-pointer group">
                            <div className={`w-8 h-8 rounded-full bg-rose-500 transition-all ${themeColor === "rose" ? "ring-2 ring-rose-500/50 ring-offset-2 ring-offset-[#0A0E17] shadow-[0_0_15px_rgba(244,63,94,0.4)]" : "border border-slate-700 opacity-60 group-hover:opacity-100"}`}></div>
                            <span className={`text-[11px] font-medium transition-colors ${themeColor === "rose" ? "text-rose-400" : "text-slate-500 group-hover:text-rose-400"}`}>Rose</span>
                          </div>

                          {/* Amber */}
                          <div onClick={() => setThemeColor("amber")} className="flex flex-col items-center gap-2 cursor-pointer group">
                            <div className={`w-8 h-8 rounded-full bg-amber-500 transition-all ${themeColor === "amber" ? "ring-2 ring-amber-500/50 ring-offset-2 ring-offset-[#0A0E17] shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "border border-slate-700 opacity-60 group-hover:opacity-100"}`}></div>
                            <span className={`text-[11px] font-medium transition-colors ${themeColor === "amber" ? "text-amber-400" : "text-slate-500 group-hover:text-amber-400"}`}>Amber</span>
                          </div>

                          <div className="w-px h-8 bg-slate-800/80 mx-1"></div>

                          {/* Auto */}
                          <div onClick={() => setThemeColor("auto")} className="flex flex-col items-center gap-2 cursor-pointer group">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr from-[#06b6d4] via-violet-500 to-rose-500 transition-all relative overflow-hidden ${themeColor === "auto" ? "ring-2 ring-white/50 ring-offset-2 ring-offset-[#0A0E17] shadow-[0_0_15px_rgba(255,255,255,0.4)]" : "border border-slate-700 opacity-60 group-hover:opacity-100"}`}>
                              <div className="absolute inset-0 bg-white/20 mix-blend-overlay"></div>
                            </div>
                            <span className={`text-[11px] font-medium transition-colors ${themeColor === "auto" ? "text-white" : "text-slate-500 group-hover:text-white"}`}>Tự động</span>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-slate-800/60"></div>

                      <div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-slate-200 font-semibold mb-2">Kiểu chữ (Typography)</h3>
                            <p className="text-slate-500 text-sm mb-4">Thay đổi font chữ mặc định của hệ thống.</p>
                            <select 
                              value={fontFamily}
                              onChange={(e) => setFontFamily(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                            >
                              <option value="geist-sans">Geist Sans (Mặc định)</option>
                              <option value="geist-mono">Geist Mono (Code)</option>
                              <option value="chakra">Chakra Petch (Cyberpunk Tech)</option>
                              <option value="rajdhani">Rajdhani (Sci-Fi Vuông Vức)</option>
                              <option value="caveat">Caveat (Nét mảnh uốn lượn)</option>
                              <option value="patrick">Patrick Hand (Viết tay vuông vức)</option>
                              <option value="quicksand">Quicksand (Tiêu đề bo tròn)</option>
                              <option value="nunito">Nunito (Hiện đại, mềm mại)</option>
                              <option value="inter">Inter (Giao diện UI chuẩn)</option>
                              <option value="roboto">Roboto (Cổ điển)</option>
                              <option value="feixen">Studio Feixen Sans (Swiss Minimalist)</option>
                            </select>
                          </div>
                          <div>
                            <h3 className="text-slate-200 font-semibold mb-2">Độ lớn (Text Scale)</h3>
                            <p className="text-slate-500 text-sm mb-4">Phóng to hoặc thu nhỏ nội dung.</p>
                            <select 
                              value={textSize}
                              onChange={(e) => setTextSize(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                            >
                              <option value="small">Nhỏ (Small 90%)</option>
                              <option value="normal">Vừa (Normal 100%)</option>
                              <option value="large">Lớn (Large 110%)</option>
                              <option value="xlarge">Rất lớn (X-Large 125%)</option>
                            </select>
                          </div>
                          <div>
                            <h3 className="text-slate-200 font-semibold mb-2">Độ bo góc (UI Style)</h3>
                            <p className="text-slate-500 text-sm mb-4">Tuỳ chỉnh độ bo góc của giao diện.</p>
                            <select 
                              value={uiStyle}
                              onChange={(e) => setUiStyle(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                            >
                              <option value="sharp">Vuông vức (Sci-Fi)</option>
                              <option value="rounded">Bo nhẹ (Mặc định)</option>
                              <option value="pill">Tròn trịa (Pill-shaped)</option>
                              <option value="neo-brutal">Neo-Brutalism (Ánh sáng cứng)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-slate-800/60"></div>

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
