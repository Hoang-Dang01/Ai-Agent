"use client";
import { motion } from "framer-motion";
import { Link2, KeyRound, Webhook, ShieldCheck, Plus, CheckCircle2, XCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";

export default function IntegrationsPage() {
  const { vibeMode, lang } = useLanguage();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const providers = [
    {
      id: "openai",
      name: "OpenAI API",
      description: lang === "vi" ? "Mô hình GPT-4o cho các tác vụ suy luận phức tạp." : "GPT-4o model for complex reasoning tasks.",
      status: "connected",
      keyPreview: "sk-proj-8x7...",
      color: "emerald"
    },
    {
      id: "anthropic",
      name: "Anthropic Claude",
      description: lang === "vi" ? "Mô hình Claude 3 Opus cho phân tích code và văn bản lớn." : "Claude 3 Opus model for massive text and code analysis.",
      status: "disconnected",
      keyPreview: "",
      color: "amber"
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      description: lang === "vi" ? "Hub trung gian truy cập hàng trăm mô hình Open-source." : "Intermediary hub to access hundreds of open-source models.",
      status: "connected",
      keyPreview: "sk-or-v1-...",
      color: "emerald"
    },
    {
      id: "neo4j",
      name: "Neo4j AuraDB",
      description: lang === "vi" ? "Graph Database đám mây lưu trữ mạng lưới Knowledge Graph." : "Cloud Graph Database for Knowledge Graph storage.",
      status: "error",
      keyPreview: "neo4j-...",
      color: "rose"
    }
  ];

  return (
    <div className="flex-1 p-8 relative overflow-hidden flex flex-col h-full">
      {/* Background Cinematic */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
      
      {vibeMode && (
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Link2 className="w-7 h-7 text-purple-400" />
            {lang === "vi" ? "Trạm Kết Nối" : "Integration Hub"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{lang === "vi" ? "Quản lý API Keys, Webhooks và các Dịch vụ bên ngoài" : "Manage API Keys, Webhooks, and external services"}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-colors font-medium text-sm">
          <Plus className="w-4 h-4" /> {lang === "vi" ? "Thêm Kết Nối" : "Custom Integration"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 overflow-y-auto pb-10 custom-scrollbar pr-2">
        {/* Core Providers */}
        <div className="flex flex-col gap-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <KeyRound className="w-4 h-4" /> Lõi LLM & Database
          </h2>
          
          {providers.map((provider) => (
            <motion.div 
              key={provider.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-[#0F141F] rounded-2xl border ${provider.status === 'connected' ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : provider.status === 'error' ? 'border-rose-500/30' : 'border-slate-800'} overflow-hidden transition-all`}
            >
              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white text-lg">{provider.name}</h3>
                      {provider.status === 'connected' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {provider.status === 'disconnected' && <AlertCircle className="w-4 h-4 text-amber-400" />}
                      {provider.status === 'error' && <XCircle className="w-4 h-4 text-rose-400" />}
                    </div>
                    <p className="text-xs text-slate-400">{provider.description}</p>
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                    provider.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    provider.status === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {provider.status}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">API Key</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type={showKeys[provider.id] ? "text" : "password"}
                        defaultValue={provider.keyPreview}
                        placeholder={provider.status === 'disconnected' ? "Paste your API key here..." : "********"}
                        className={`w-full bg-[#0A0E17] border ${provider.status === 'error' ? 'border-rose-500/50' : 'border-slate-700'} rounded-xl px-4 py-2.5 text-sm font-mono text-slate-300 focus:outline-none focus:border-purple-500 transition-colors pr-10`}
                      />
                      {provider.keyPreview && (
                        <button 
                          onClick={() => toggleKey(provider.id)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-slate-700">
                      Save
                    </button>
                  </div>
                  {provider.status === 'error' && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Connection refused. Please check the key validity.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Webhooks & Security */}
        <div className="flex flex-col gap-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <Webhook className="w-4 h-4" /> Webhooks & Events
          </h2>
          
          <div className="bg-[#0F141F] rounded-2xl border border-slate-800 overflow-hidden shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-md">Discord Notification</h3>
                <p className="text-xs text-slate-400 mt-1">{lang === "vi" ? "Gửi cảnh báo rớt mạng Bot hoặc lỗi RAG về Discord." : "Send Bot disconnect or RAG error alerts to Discord."}</p>
              </div>
              <div className="w-10 h-5 bg-emerald-500 rounded-full flex items-center p-0.5 justify-end cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full shadow"></div>
              </div>
            </div>
            <input 
              type="text" 
              defaultValue="https://discord.com/api/webhooks/123456/abcdef"
              className="w-full bg-[#0A0E17] border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="bg-[#0F141F] rounded-2xl border border-slate-800 overflow-hidden shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-md">GitHub Auto-Sync</h3>
                <p className="text-xs text-slate-400 mt-1">{lang === "vi" ? "Tự động trigger pipeline khi có code mới trên main." : "Auto trigger pipeline on new commits to main."}</p>
              </div>
              <div className="w-10 h-5 bg-slate-700 rounded-full flex items-center p-0.5 justify-start cursor-pointer">
                <div className="w-4 h-4 bg-slate-400 rounded-full shadow"></div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-5 rounded-2xl bg-purple-500/5 border border-purple-500/10">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-200 text-sm">{lang === "vi" ? "Bảo mật Token" : "Token Security"}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {lang === "vi" ? "Tất cả API Key đều được mã hóa nội bộ ở tầng Backend và không bao giờ bị lưu vào LocalStorage của trình duyệt. Hãy chắc chắn thêm .env vào .gitignore trước khi commit." : "All API Keys are encrypted internally at the Backend and are never saved to browser LocalStorage. Ensure .env is added to .gitignore before committing."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
