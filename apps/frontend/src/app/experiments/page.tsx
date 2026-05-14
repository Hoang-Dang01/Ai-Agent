"use client";
import { motion } from "framer-motion";
import { FlaskConical, Play, Bug, Database, Sparkles, Server, Beaker, FileCode2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export default function ExperimentsPage() {
  const { vibeMode, lang } = useLanguage();

  const experiments = [
    {
      id: "rag-chunking",
      name: lang === "vi" ? "Kiểm Thử DeepDoc Parser" : "DeepDoc Parser Test",
      description: lang === "vi" ? "Kiểm tra thuật toán RAGFlow băm bảng biểu và tiêu đề trước khi đưa vào The Vault." : "Test RAGFlow algorithm for table and header chunking before Vault ingestion.",
      icon: Database,
      status: "Ready",
      colorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      buttonClass: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
    },
    {
      id: "bot-stealth",
      name: lang === "vi" ? "Kiểm Thử Tàng Hình AFK" : "Stealth AFK Ladder Test",
      description: lang === "vi" ? "Mở môi trường test nội bộ để thử nghiệm kịch bản Jitter Margin và thuật toán đá văng Bot khỏi server." : "Open internal test environment to experiment with Jitter Margin and Bot kick evasion algorithms.",
      icon: Bug,
      status: "In Progress",
      colorClass: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      buttonClass: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20"
    },
    {
      id: "scraper-proxy",
      name: lang === "vi" ? "Đổi Proxy Playwright" : "Playwright Proxy Rotation",
      description: lang === "vi" ? "Test kịch bản cào dữ liệu: Tự động đổi IP Proxy khi bị dính Cloudflare Block." : "Test data scraping scenario: Auto IP Proxy rotation when hit by Cloudflare block.",
      icon: Server,
      status: "Failed (Need Fix)",
      colorClass: "bg-rose-500/10 border-rose-500/20 text-rose-400",
      buttonClass: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
    },
    {
      id: "llm-reasoning",
      name: lang === "vi" ? "Bộ Định Tuyến Ý Định (PhoBERT)" : "Intent Router (PhoBERT)",
      description: lang === "vi" ? "Thử nghiệm bộ lọc câu hỏi. Nhập một câu hỏi để xem AI điều hướng vào luồng nào." : "Test question filtering. Input a question to see which flow the AI routes it to.",
      icon: Sparkles,
      status: "Ready",
      colorClass: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
      buttonClass: "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20"
    }
  ];

  return (
    <div className="flex-1 p-8 relative overflow-hidden flex flex-col h-full">
      {/* Background Cinematic */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
      
      {vibeMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none z-0"></div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <FlaskConical className="w-7 h-7 text-amber-400" />
            {lang === "vi" ? "Khu Thử Nghiệm Sandbox" : "Experiments Sandbox"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{lang === "vi" ? "Phòng thí nghiệm lõi. Nơi thử nghiệm các module rủi ro cao trước khi đưa ra Production." : "Core laboratory. Test high-risk modules here before deploying to Production."}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors font-medium text-sm border border-slate-700">
          <FileCode2 className="w-4 h-4" /> {lang === "vi" ? "Xem Bản Nháp" : "View Scratchpads"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 overflow-y-auto pb-10 custom-scrollbar pr-2">
        {experiments.map((exp, idx) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className="group bg-[#0F141F] rounded-2xl border border-slate-800 hover:border-slate-600 overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex flex-col"
          >
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${exp.colorClass}`}>
                  <exp.icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${exp.colorClass}`}>
                  {exp.status}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">{exp.name}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {exp.description}
              </p>
            </div>

            <div className="p-4 border-t border-slate-800/60 bg-slate-900/30 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500">ID: {exp.id}</span>
              <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${exp.buttonClass}`}>
                <Play className="w-4 h-4 fill-current" /> RUN TEST
              </button>
            </div>
          </motion.div>
        ))}
        
        {/* Placeholder for adding new experiment */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border-2 border-dashed border-slate-800 hover:border-slate-600 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-500 hover:text-slate-400 transition-colors cursor-pointer bg-slate-900/10 hover:bg-slate-900/20 min-h-[250px]"
        >
          <Beaker className="w-10 h-10 mb-3 opacity-50" />
          <h3 className="font-bold">{lang === "vi" ? "Tạo Thử Nghiệm Mới" : "Create New Experiment"}</h3>
          <p className="text-xs mt-1 text-center max-w-xs">{lang === "vi" ? "Tạo sandbox mới để test một tính năng độc lập." : "Create a new sandbox to test an isolated feature."}</p>
        </motion.div>
      </div>
    </div>
  );
}
