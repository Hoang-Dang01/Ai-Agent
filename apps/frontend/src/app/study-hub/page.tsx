"use client";
import { motion } from "framer-motion";
import { Search, Send, FileText, BrainCircuit, Mic, Plus, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useState } from "react";

export default function StudyHubPage() {
  const { vibeMode, lang } = useLanguage();
  const [query, setQuery] = useState("");

  return (
    <div className="flex-1 p-6 relative overflow-hidden flex flex-col h-full">
      {/* Background Cinematic */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
      
      {vibeMode && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            <BookOpen className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{lang === "vi" ? "Xin chào. Hôm nay bạn muốn nghiên cứu gì?" : "Hello. What would you like to study today?"}</h1>
          <p className="text-slate-400">{lang === "vi" ? "Trợ lý AI nội bộ đã kết nối với 12,400 chunk dữ liệu từ Kho Trí Thức." : "Internal AI assistant connected to 12,400 data chunks from The Vault."}</p>
        </motion.div>

        {/* Input Omni-box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="w-full relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-50"></div>
          <div className="relative bg-[#0F141F] border border-slate-700 hover:border-cyan-500/50 transition-colors rounded-2xl p-2 flex items-center shadow-2xl">
            <button className="p-3 text-slate-400 hover:text-cyan-400 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === "vi" ? "Hỏi về văn bản luật, yêu cầu viết code, tóm tắt tài liệu..." : "Ask about legal documents, request code, summarize texts..."}
              className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-600 px-2 py-3 text-lg"
            />
            <button className="p-3 text-slate-400 hover:text-white transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <button className={`p-3 ml-2 rounded-xl flex items-center justify-center transition-all ${query ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
              <Send className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Quick Action Suggestions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="flex flex-wrap items-center justify-center gap-3 mt-8"
        >
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors">
            <FileText className="w-4 h-4 text-emerald-400" /> {lang === "vi" ? "Tóm tắt tài liệu Nghị Định 100" : "Summarize Decree 100"}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors">
            <Search className="w-4 h-4 text-purple-400" /> {lang === "vi" ? "Tìm kiếm điều kiện hưởng BHXH" : "Search social insurance conditions"}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm transition-colors">
            <BrainCircuit className="w-4 h-4 text-amber-400" /> {lang === "vi" ? "Hỏi đáp bài giảng Generative AI" : "Generative AI lecture Q&A"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
