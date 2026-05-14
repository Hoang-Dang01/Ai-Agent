"use client";
import { motion } from "framer-motion";
import { Cpu, Settings, TerminalSquare, Activity, Gamepad2, Eye, Globe, BrainCircuit, Play, Square } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

export default function AIEnginesPage() {
  const { vibeMode, lang } = useLanguage();
  
  const engines = [
    {
      id: "minecraft",
      name: "Minecraft AFK Swarm",
      description: lang === "vi" ? "Tự động farm, auto-reconnect, né Admin. Giao tiếp qua Mineflayer Protocol." : "Auto farm, auto-reconnect, avoid Admins. Communicates via Mineflayer Protocol.",
      icon: Gamepad2,
      status: "online",
      colorClass: "bg-emerald-500/10 border-emerald-500/20",
      iconColor: "text-emerald-400",
      uptime: "12h 45m",
      memory: "450 MB",
      action: "Farming Carrots"
    },
    {
      id: "vision",
      name: "Vision OCR Bot",
      description: lang === "vi" ? "Phân tích Layout, đọc bảng biểu và trích xuất dữ liệu từ PDF/Ảnh (DeepDoc Engine)." : "Layout analysis, table reading and data extraction from PDF/Images (DeepDoc Engine).",
      icon: Eye,
      status: "idle",
      colorClass: "bg-cyan-500/10 border-cyan-500/20",
      iconColor: "text-cyan-400",
      uptime: "2h 10m",
      memory: "120 MB",
      action: "Waiting for tasks"
    },
    {
      id: "scraper",
      name: "Web Scraper Engine",
      description: lang === "vi" ? "Cào dữ liệu thô (Playwright/Puppeteer) vượt Captcha từ các trang web phức tạp." : "Raw data scraping (Playwright/Puppeteer) bypassing Captchas on complex sites.",
      icon: Globe,
      status: "error",
      colorClass: "bg-rose-500/10 border-rose-500/20",
      iconColor: "text-rose-400",
      uptime: "0h 0m",
      memory: "N/A",
      action: "Connection Timeout (Proxy failed)"
    },
    {
      id: "ollama",
      name: "Local Ollama Core",
      description: lang === "vi" ? "Chạy LLM nội bộ không cần mạng (Llama 3, Mistral) để xử lý tác vụ nhạy cảm." : "Run offline internal LLMs (Llama 3, Mistral) for processing sensitive tasks.",
      icon: BrainCircuit,
      status: "offline",
      colorClass: "bg-indigo-500/10 border-indigo-500/20",
      iconColor: "text-indigo-400",
      uptime: "0h 0m",
      memory: "0 MB",
      action: "Offline"
    }
  ];

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'online': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'idle': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'error': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'offline': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getDotStyle = (status: string) => {
    switch(status) {
      case 'online': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]';
      case 'idle': return 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]';
      case 'error': return 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]';
      case 'offline': return 'bg-slate-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="flex-1 p-8 relative overflow-hidden flex flex-col h-full">
      {/* Background Cinematic */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
      
      {vibeMode && (
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Cpu className="w-7 h-7 text-indigo-400" />
            AI Engines Fleet
          </h1>
          <p className="text-slate-400 text-sm mt-1">{lang === "vi" ? "Quản lý và điều phối các hệ thống Bot tự động hóa" : "Manage and orchestrate automated Bot fleets"}</p>
        </div>
        <div className="flex items-center gap-4 bg-[#0A0E17]/80 px-4 py-2 rounded-xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-xs font-medium text-slate-300">1 Online</span>
          </div>
          <div className="w-px h-4 bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
            <span className="text-xs font-medium text-slate-300">1 Idle</span>
          </div>
          <div className="w-px h-4 bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
            <span className="text-xs font-medium text-slate-300">1 Error</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 overflow-y-auto pb-10 custom-scrollbar pr-2">
        {engines.map((engine, idx) => (
          <motion.div
            key={engine.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            className="group bg-[#0F141F] border border-slate-800 hover:border-slate-600 rounded-2xl overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col"
          >
            {/* Card Header */}
            <div className="p-5 border-b border-slate-800/60 flex items-start justify-between bg-slate-900/20">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${engine.colorClass} border flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <engine.icon className={`w-6 h-6 ${engine.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-200 text-lg group-hover:text-white transition-colors">{engine.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${getDotStyle(engine.status)}`}></div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusStyle(engine.status)}`}>
                      {engine.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors" title="Terminal Output">
                  <TerminalSquare className="w-4 h-4" />
                </button>
                <Link href={`/ai-engines/${engine.id}`} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors" title="Engine Settings">
                  <Settings className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                {engine.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-[#0A0E17] rounded-xl p-3 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Uptime
                  </div>
                  <div className="text-sm font-mono text-slate-300">{engine.uptime}</div>
                </div>
                <div className="bg-[#0A0E17] rounded-xl p-3 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> Memory
                  </div>
                  <div className="text-sm font-mono text-slate-300">{engine.memory}</div>
                </div>
              </div>

              {/* Action Banner & Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                <div className="flex items-center gap-2 max-w-[60%]">
                  <span className="text-xs text-slate-500 whitespace-nowrap">Status Log:</span>
                  <span className={`text-xs font-mono truncate ${engine.status === 'error' ? 'text-rose-400' : 'text-slate-300'}`}>
                    {engine.action}
                  </span>
                </div>
                <div className="flex gap-2">
                  {engine.status === 'online' || engine.status === 'idle' ? (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors text-xs font-bold">
                      <Square className="w-3.5 h-3.5 fill-current" /> STOP
                    </button>
                  ) : (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors text-xs font-bold">
                      <Play className="w-3.5 h-3.5 fill-current" /> START
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
