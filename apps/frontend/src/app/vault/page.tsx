"use client";
import { motion } from "framer-motion";
import { Upload, Search, FileText, FileCode, Network, Database, Plus, FolderArchive } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

import { DataParticles } from "@/components/ui/data-particles";
import { KnowledgeGraph3D } from "@/components/vault/knowledge-graph";

export default function VaultPage() {
  const { lang, vibeMode } = useLanguage();
  
  const documents = [
    { name: "agency-agents-overview.md", type: "markdown", status: "Indexed", date: "2 hours ago", size: "12 KB" },
    { name: "Q1-Financial-Report.pdf", type: "pdf", status: "Indexing...", date: "Just now", size: "2.4 MB" },
    { name: "Company-Guidelines.pdf", type: "pdf", status: "Failed", date: "3 days ago", size: "1.1 MB" },
  ];

  return (
    <div className="flex flex-col h-full relative bg-[#0A0E17] overflow-hidden">
      {/* Background Particles */}
      <DataParticles vibeMode={vibeMode} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="h-20 border-b border-slate-800/60 px-8 flex items-center justify-between relative z-10 bg-[#0A0E17]/80 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Database className="w-6 h-6 text-emerald-400" />
            {lang === "vi" ? "Kho Trí Thức" : "The Vault"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">Vector RAG Database & Knowledge Graph</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="text" 
              placeholder={lang === "vi" ? "Tìm kiếm trong não bộ AI..." : "Search your entire brain..."}
              className="w-80 bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600 shadow-inner"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Plus className="w-4 h-4" />
            {lang === "vi" ? "Nạp Dữ Liệu" : "Upload Data"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 grid grid-cols-12 gap-6 relative z-10 overflow-y-auto">
        
        {/* Left Column: Data Sources (4 cols on lg, 12 cols on mobile) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Upload Zone */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-slate-800/80 bg-[#0F141F]/80 backdrop-blur-xl p-6 relative overflow-hidden group border-dashed hover:border-emerald-500/50 transition-colors cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700 shadow-inner group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-slate-200 font-bold">{lang === "vi" ? "Kéo & Thả File" : "Drag & Drop Files"}</h3>
                <p className="text-slate-500 text-sm mt-1">PDF, Markdown, TXT, CSV (Max 50MB)</p>
              </div>
            </div>
          </motion.div>

          {/* Document List */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-800/80 bg-[#0F141F]/80 backdrop-blur-xl flex flex-col flex-1 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
              <h3 className="text-slate-200 font-bold flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-emerald-500" />
                {lang === "vi" ? "Tài Liệu Đã Nạp" : "Ingested Documents"}
              </h3>
              <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-400">1,240 Chunks</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {documents.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 hover:bg-slate-800/40 rounded-xl cursor-pointer transition-colors group">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${doc.type === 'pdf' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : doc.type === 'markdown' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                    {doc.type === 'pdf' ? <FileText className="w-5 h-5" /> : <FileCode className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate group-hover:text-emerald-400 transition-colors">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-500">{doc.size} • {doc.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${doc.status === 'Indexed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : doc.status === 'Indexing...' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Knowledge Graph (8 cols on lg, 12 cols on mobile) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-12 lg:col-span-8 rounded-2xl border border-slate-800/80 bg-[#0F141F]/60 backdrop-blur-xl flex flex-col overflow-hidden relative min-h-[400px] lg:min-h-0"
        >
          {/* Top Bar */}
          <div className="h-14 border-b border-slate-800/60 bg-slate-900/50 flex items-center px-4 justify-between z-10">
            <div className="flex items-center gap-3">
              <Network className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-slate-200">{lang === "vi" ? "Bản Đồ Mạng Lưới Tri Thức" : "Knowledge Graph"}</span>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700">2D View</button>
              <button className="px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.1)]">3D Galaxy</button>
            </div>
          </div>

          {/* Graph Visualization Area */}
          <KnowledgeGraph3D vibeMode={vibeMode} />
        </motion.div>
      </main>
    </div>
  );
}
