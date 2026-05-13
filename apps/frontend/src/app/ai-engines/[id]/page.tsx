"use client";
import { use } from "react";
import { ChevronLeft, TerminalSquare, Settings2, Play, Square, Save, Server, ShieldAlert, Users, Plus, Clock } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

// Cấu hình mock data tạm thời
const getEngineConfig = (id: string) => {
  const configs: Record<string, {name: string, status: string, env: {key: string, value: string}[], logs: string[]}> = {
    minecraft: {
      name: "Minecraft AFK Swarm",
      status: "online",
      env: [
        { key: "MC_SERVER_IP", value: "play.hypixel.net" },
        { key: "MC_PORT", value: "25565" },
        { key: "AUTO_RECONNECT", value: "true" },
        { key: "ANTI_AFK_INTERVAL", value: "300" }
      ],
      logs: [
        "[10:45:01] INFO: Connecting to play.hypixel.net...",
        "[10:45:03] SUCCESS: Logged in as TuringBot_01",
        "[10:46:12] ACTION: Farming carrots in slot 1",
        "[10:50:00] WARNING: Admin 'Notch' joined the server. Activating stealth mode."
      ]
    },
    vision: {
      name: "Vision OCR Bot",
      status: "idle",
      env: [
        { key: "OCR_ENGINE", value: "DeepDoc_RAGFlow" },
        { key: "MAX_THREADS", value: "4" }
      ],
      logs: [
        "[08:00:00] INFO: Vision Engine Started.",
        "[08:00:05] INFO: DeepDoc module loaded successfully.",
        "[08:10:00] IDLE: Waiting for new PDF tasks..."
      ]
    }
  };
  return configs[id] || {
    name: `${id.charAt(0).toUpperCase() + id.slice(1)} Engine`,
    status: "offline",
    env: [{ key: "API_KEY", value: "********" }],
    logs: ["Engine is offline."]
  };
};

export default function EngineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { vibeMode } = useLanguage();
  const resolvedParams = use(params);
  const engineId = resolvedParams.id || "unknown";
  const config = getEngineConfig(engineId);

  return (
    <div className="flex-1 p-8 relative overflow-hidden flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* Background Cinematic */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
      
      {vibeMode && (
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none z-0"></div>
      )}

      {/* Top Navigation */}
      <div className="relative z-10 mb-8">
        <Link href="/ai-engines" className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-4 group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Engines Fleet</span>
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              {config.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : config.status === 'idle' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                STATUS: {config.status}
              </span>
              <span className="text-sm text-slate-500 font-mono">ID: {engineId}-core-01</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium text-sm border border-slate-700">
              <Server className="w-4 h-4" /> Restart
            </button>
            {config.status === 'online' || config.status === 'idle' ? (
              <button className="flex items-center gap-2 px-6 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors font-bold text-sm shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <Square className="w-4 h-4 fill-current" /> STOP ENGINE
              </button>
            ) : (
              <button className="flex items-center gap-2 px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Play className="w-4 h-4 fill-current" /> START ENGINE
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10 pb-10">
        {/* Left Column: Config */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="bg-[#0F141F] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/30">
              <Settings2 className="w-5 h-5 text-cyan-400" />
              <h2 className="font-bold text-white">Environment Variables</h2>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {config.env.map((envVar: {key: string, value: string}, idx: number) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-slate-400">{envVar.key}</label>
                  <input 
                    type="text" 
                    defaultValue={envVar.value} 
                    className="bg-[#0A0E17] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              ))}
              
              <button className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-medium text-sm border border-cyan-500/20 transition-colors">
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>
          </div>

          <div className="bg-[#0F141F] rounded-2xl border border-rose-900/30 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-rose-900/30 flex items-center gap-3 bg-rose-950/10">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h2 className="font-bold text-rose-100">Danger Zone</h2>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-400 mb-4">Actions here can cause unrecoverable state loss for this engine.</p>
              <button className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-medium text-sm border border-rose-500/20 hover:border-rose-500 transition-all">
                Purge Engine Data
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Terminal & Metrics */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <div className="bg-[#0A0E17] rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex-1 flex flex-col min-h-[400px]">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <TerminalSquare className="w-5 h-5 text-slate-400" />
                <h2 className="font-bold text-slate-200 text-sm font-mono">Live Terminal Output</h2>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
              </div>
            </div>
            <div className="p-5 flex-1 overflow-y-auto font-mono text-[13px] leading-loose flex flex-col gap-1">
              {config.logs.map((log: string, idx: number) => {
                let colorClass = "text-slate-300";
                if (log.includes("ERROR") || log.includes("FAILED")) colorClass = "text-rose-400";
                if (log.includes("SUCCESS") || log.includes("INFO")) colorClass = "text-emerald-400";
                if (log.includes("WARNING")) colorClass = "text-amber-400";
                
                return (
                  <div key={idx} className={colorClass}>
                    {log}
                  </div>
                );
              })}
              {config.status !== 'offline' && (
                <div className="flex items-center gap-2 mt-2 text-slate-500">
                  <span className="animate-pulse">_</span>
                </div>
              )}
            </div>
          </div>

          {/* Minecraft Specific: Multi-Account Swarm Manager */}
          {engineId === 'minecraft' && (
            <div className="bg-[#0A0E17] rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex-col flex">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-bold text-white">Swarm Accounts & AFK Tracker</h2>
                </div>
                <button className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Thêm Account
                </button>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800/80 text-slate-400 text-xs">
                      <th className="p-4 font-medium">Tên Đăng Nhập</th>
                      <th className="p-4 font-medium">Mật Khẩu</th>
                      <th className="p-4 font-medium">Tình Trạng</th>
                      <th className="p-4 font-medium"><div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Thời Gian Treo</div></th>
                      <th className="p-4 font-medium">Mục Tiêu (Cày Top)</th>
                      <th className="p-4 font-medium text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 divide-y divide-slate-800/60">
                    <tr className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-mono text-cyan-400">TuringBot_01</td>
                      <td className="p-4 font-mono text-slate-500">********</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></span>
                          Đang treo máy
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-white">12h 45m</td>
                      <td className="p-4 font-mono text-amber-400">24h 00m</td>
                      <td className="p-4 text-right">
                        <button className="text-slate-500 hover:text-white transition-colors text-xs font-medium uppercase tracking-wider">Sửa</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-mono text-cyan-400">TuringBot_02</td>
                      <td className="p-4 font-mono text-slate-500">********</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Đang kết nối lại...
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-white">08h 20m</td>
                      <td className="p-4 font-mono text-amber-400">12h 00m</td>
                      <td className="p-4 text-right">
                        <button className="text-slate-500 hover:text-white transition-colors text-xs font-medium uppercase tracking-wider">Sửa</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 font-mono text-slate-500">TuringBot_03</td>
                      <td className="p-4 font-mono text-slate-500">********</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-500/10 px-2 py-1 rounded border border-slate-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          Nghỉ ngơi
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-500">00h 00m</td>
                      <td className="p-4 font-mono text-amber-400">48h 00m</td>
                      <td className="p-4 text-right">
                        <button className="text-slate-500 hover:text-white transition-colors text-xs font-medium uppercase tracking-wider">Sửa</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
