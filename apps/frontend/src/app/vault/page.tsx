"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, Search, FileText, FileCode, Network, Database, Plus, 
  FolderArchive, GitCommit, ChevronRight, History, ArrowRight, Eye, Diff, CornerDownRight
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useState, useEffect, useCallback } from "react";
import { DataParticles } from "@/components/ui/data-particles";
import { KnowledgeGraph3D } from "@/components/vault/knowledge-graph";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface Version {
  id: string;
  version_number: number;
  content: string;
  commit_message: string | null;
  created_at: string;
}

interface Document {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  versions: Version[];
}

export default function VaultPage() {
  const { lang, vibeMode } = useLanguage();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'text' | 'diff'>('text');
  
  // Form states
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCommitMsg, setNewCommitMsg] = useState("");
  const [showAppendForm, setShowAppendForm] = useState(false);
  const [appendContent, setAppendContent] = useState("");
  const [appendCommitMsg, setAppendCommitMsg] = useState("");

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://localhost:8000';

  // Fetch all documents from the local Python RAG API
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/rag/documents/`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error("[Vault] Error loading RAG documents:", err);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle document creation
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      const res = await fetch(`${backendUrl}/api/rag/documents/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          initial_content: newContent,
          commit_message: newCommitMsg.trim() || "Initial commit"
        })
      });
      if (!res.ok) throw new Error("Failed to create document");
      
      const createdDoc = await res.json();
      await fetchDocuments();
      
      // Select the newly created document
      setSelectedDocId(createdDoc.id);
      setSelectedVersionIdx(0);
      setActiveTab('text');
      
      // Reset form
      setNewTitle("");
      setNewContent("");
      setNewCommitMsg("");
      setShowCreateModal(false);
    } catch (err) {
      console.error("[Vault] Error creating document:", err);
    }
  };

  // Handle appending a new version
  const handleAppendVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !appendContent.trim()) return;

    try {
      const res = await fetch(`${backendUrl}/api/rag/documents/${selectedDocId}/versions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: appendContent,
          commit_message: appendCommitMsg.trim() || `Commit v${(selectedDoc?.versions?.length || 0) + 1}`
        })
      });
      if (!res.ok) throw new Error("Failed to append version");
      
      await fetchDocuments();
      
      // Focus on the latest version index
      const updatedDoc = documents.find(d => d.id === selectedDocId);
      if (updatedDoc) {
        setSelectedVersionIdx(updatedDoc.versions.length);
      }
      
      // Reset append form
      setAppendContent("");
      setAppendCommitMsg("");
      setShowAppendForm(false);
      setActiveTab('diff'); // Automatically switch to diff to show updates!
    } catch (err) {
      console.error("[Vault] Error appending version:", err);
    }
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId) || null;
  const activeVersion = selectedDoc && selectedDoc.versions[selectedVersionIdx]
    ? selectedDoc.versions[selectedVersionIdx]
    : null;

  const previousVersion = selectedDoc && selectedVersionIdx > 0
    ? selectedDoc.versions[selectedVersionIdx - 1]
    : null;

  // Filtered documents list based on Search Omni-box
  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.versions && doc.versions.some(v => v.content.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Client-Side Side-by-Side Line Diff Calculator
  const calculateLineDiff = (oldStr: string, newStr: string) => {
    const oldLines = oldStr.split("\n");
    const newLines = newStr.split("\n");
    const maxLines = Math.max(oldLines.length, newLines.length);
    const diffs = [];

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] !== undefined ? oldLines[i] : null;
      const newLine = newLines[i] !== undefined ? newLines[i] : null;

      if (oldLine === newLine) {
        diffs.push({ oldLine, newLine, type: "equal" });
      } else {
        if (oldLine !== null && newLine === null) {
          diffs.push({ oldLine, newLine: "", type: "removed" });
        } else if (oldLine === null && newLine !== null) {
          diffs.push({ oldLine: "", newLine, type: "added" });
        } else {
          diffs.push({ oldLine, newLine, type: "modified" });
        }
      }
    }
    return diffs;
  };

  const diffResult = previousVersion && activeVersion
    ? calculateLineDiff(previousVersion.content, activeVersion.content)
    : [];

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full relative overflow-hidden">
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
          <p className="text-sm text-slate-400 mt-1">Linear Versioning RAG Database & Knowledge Graph</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "vi" ? "Tìm kiếm tài liệu & lịch sử..." : "Search docs & history..."}
              className="w-80 bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600 shadow-inner"
            />
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {lang === "vi" ? "Tạo Tài Liệu" : "New Document"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 grid grid-cols-12 gap-6 relative z-10 overflow-y-auto">
        
        {/* Left Column: Data Sources */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full">
          {/* Document List */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-slate-800/80 bg-[#0F141F]/80 backdrop-blur-xl flex flex-col flex-1 overflow-hidden min-h-[400px]"
          >
            <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
              <h3 className="text-slate-200 font-bold flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-emerald-500" />
                {lang === "vi" ? "Danh Sách Trí Thức" : "Brain Inventory"}
              </h3>
              <span className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700/50">
                {documents.length} Docs
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 custom-scrollbar">
              {filteredDocuments.length === 0 ? (
                <div className="text-slate-500 text-xs italic py-12 text-center select-none">
                  Chưa có tài liệu nào được nạp vào vector db.
                </div>
              ) : (
                filteredDocuments.map((doc) => (
                  <div 
                    key={doc.id} 
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setSelectedVersionIdx(doc.versions.length - 1);
                      setActiveTab('text');
                      setShowAppendForm(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition group border ${
                      selectedDocId === doc.id
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                        : 'bg-slate-900/10 border-transparent hover:bg-slate-800/30'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                      selectedDocId === doc.id
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-500 group-hover:text-slate-300'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`text-sm font-medium truncate ${
                        selectedDocId === doc.id ? 'text-emerald-400' : 'text-slate-200 group-hover:text-emerald-400 transition-colors'
                      }`}>
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-[9px] text-slate-500">
                        <span>v{doc.versions.length} commits</span>
                        <span>•</span>
                        <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Visual Inspector or 3D Galaxy Graph */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full">
          <AnimatePresence mode="wait">
            {!selectedDoc ? (
              /* If no document selected: Render 3D Knowledge Graph Galaxy */
              <motion.div 
                key="graph"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="rounded-2xl border border-slate-800/80 bg-[#0F141F]/60 backdrop-blur-xl flex flex-col flex-1 overflow-hidden relative min-h-[450px]"
              >
                <div className="h-14 border-b border-slate-800/60 bg-slate-900/50 flex items-center px-4 justify-between z-10">
                  <div className="flex items-center gap-3">
                    <Network className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-slate-200">
                      {lang === "vi" ? "Bản Đồ Mạng Lưới Tri Thức 3D" : "Knowledge Graph Galaxy"}
                    </span>
                  </div>
                </div>
                <KnowledgeGraph3D vibeMode={vibeMode} />
              </motion.div>
            ) : (
              /* Active Document Inspector */
              <motion.div 
                key="inspector"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="rounded-2xl border border-slate-800/80 bg-[#0F141F]/80 backdrop-blur-xl flex flex-col flex-1 overflow-hidden min-h-[450px]"
              >
                {/* Inspector Topbar */}
                <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-900/20 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-slate-200 font-bold text-base leading-tight">
                        {selectedDoc.title}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        ID: {selectedDoc.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 bg-slate-900/60 border border-slate-700/50 rounded-xl p-1 shadow-inner">
                      <button 
                        onClick={() => setActiveTab('text')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          activeTab === 'text'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" /> Text
                      </button>
                      <button 
                        disabled={!previousVersion}
                        onClick={() => previousVersion && setActiveTab('diff')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          !previousVersion 
                            ? 'opacity-40 cursor-not-allowed text-slate-700' 
                            : activeTab === 'diff'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <Diff className="w-3.5 h-3.5" /> Compare Diff
                      </button>
                    </div>

                    <button 
                      onClick={() => {
                        setShowAppendForm(!showAppendForm);
                        if (!showAppendForm) {
                          setAppendContent(activeVersion?.content || "");
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <GitCommit className="w-3.5 h-3.5" /> Commit Edit
                    </button>
                  </div>
                </div>

                {/* Main Content Splitting */}
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                  {showAppendForm ? (
                    /* In-place Commit Editor Form */
                    <form onSubmit={handleAppendVersion} className="p-6 flex flex-col gap-4 text-left">
                      <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <CornerDownRight className="w-4 h-4 text-emerald-400" />
                        TẠO PHIÊN BẢN MỚI (COMMIT v{selectedDoc.versions.length + 1})
                      </h3>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                          Nội dung văn bản gốc
                        </label>
                        <textarea
                          rows={10}
                          value={appendContent}
                          onChange={(e) => setAppendContent(e.target.value)}
                          className="w-full bg-[#070B13] border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 custom-scrollbar"
                          placeholder="Nhập nội dung sửa đổi bổ sung..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                            Commit Message
                          </label>
                          <input
                            type="text"
                            value={appendCommitMsg}
                            onChange={(e) => setAppendCommitMsg(e.target.value)}
                            className="bg-[#070B13] border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                            placeholder="Mô tả thay đổi (ví dụ: Cập nhật điều khoản)"
                          />
                        </div>
                        <div className="flex items-end gap-3 justify-end">
                          <button
                            type="button"
                            onClick={() => setShowAppendForm(false)}
                            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/40 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
                          >
                            Hủy bỏ
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition shadow-[0_0_10px_rgba(16,185,129,0.1)] cursor-pointer"
                          >
                            Commit Phiên bản
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    /* Document Inspector Viewers */
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-y-auto">
                      {/* Left: Commit History Navigator (3 cols) */}
                      <div className="md:col-span-3 border-r border-slate-800/60 p-4 bg-slate-900/10 flex flex-col gap-3 text-left">
                        <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                          <History className="w-3.5 h-3.5" /> Commit History
                        </h4>
                        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[300px] md:max-h-none pr-1 custom-scrollbar">
                          {selectedDoc.versions.map((ver, idx) => (
                            <button
                              key={ver.id}
                              onClick={() => {
                                setSelectedVersionIdx(idx);
                                if (idx === 0) setActiveTab('text');
                              }}
                              className={`w-full p-2.5 rounded-lg border text-left flex flex-col gap-1 transition cursor-pointer ${
                                selectedVersionIdx === idx
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-100'
                                  : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  selectedVersionIdx === idx ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                                }`}>
                                  v{ver.version_number}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {new Date(ver.created_at).toLocaleTimeString('en-US', {hour12:false}).substring(0, 5)}
                                </span>
                              </div>
                              <span className="text-[11px] font-medium truncate mt-0.5">
                                {ver.commit_message || "No commit message"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right: Code Viewer / Diff Compare (9 cols) */}
                      <div className="md:col-span-9 p-6 flex flex-col min-h-[350px] md:min-h-0 bg-black/10">
                        {activeTab === 'text' && activeVersion && (
                          <div className="flex-1 flex flex-col text-left">
                            <div className="mb-3 flex items-center justify-between text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider">
                              <span>Raw content view</span>
                              <span>Lines: {activeVersion.content.split('\n').length}</span>
                            </div>
                            <pre className="flex-1 w-full bg-[#070B13] border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-auto custom-scrollbar select-all whitespace-pre-wrap">
                              {activeVersion.content}
                            </pre>
                          </div>
                        )}

                        {activeTab === 'diff' && activeVersion && previousVersion && (
                          <div className="flex-1 flex flex-col text-left min-h-0">
                            <div className="mb-4 grid grid-cols-2 gap-4 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                              <span className="flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5 rotate-180 text-rose-500" /> Version v{previousVersion.version_number} (Old)</span>
                              <span className="flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5 text-emerald-500" /> Version v{activeVersion.version_number} (New)</span>
                            </div>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 overflow-y-auto">
                              {/* Left Column: Old Version content */}
                              <div className="border border-slate-800 rounded-xl p-4 bg-[#0A0507]/40 overflow-auto font-mono text-[11px] leading-relaxed custom-scrollbar whitespace-pre-wrap">
                                {diffResult.map((line, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`py-0.5 px-1 min-h-[20px] rounded ${
                                      line.type === 'removed' 
                                        ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500 font-bold' 
                                        : line.type === 'modified'
                                          ? 'bg-amber-950/20 text-amber-300 border-l-2 border-amber-500'
                                          : 'text-slate-500 opacity-60'
                                    }`}
                                  >
                                    {line.oldLine}
                                  </div>
                                ))}
                              </div>
                              {/* Right Column: New Version content */}
                              <div className="border border-slate-800 rounded-xl p-4 bg-[#050A07]/40 overflow-auto font-mono text-[11px] leading-relaxed custom-scrollbar whitespace-pre-wrap">
                                {diffResult.map((line, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`py-0.5 px-1 min-h-[20px] rounded ${
                                      line.type === 'added' 
                                        ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500 font-bold' 
                                        : line.type === 'modified'
                                          ? 'bg-amber-950/20 text-emerald-200 border-l-2 border-emerald-500 font-bold'
                                          : 'text-slate-300'
                                    }`}
                                  >
                                    {line.newLine}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Ingest Document Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-[#0F141F] p-6 shadow-2xl overflow-hidden text-left"
            >
              <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-emerald-500 to-cyan-400"></div>
              
              <h3 className="text-slate-200 font-bold text-lg mb-4 flex items-center gap-2 select-none">
                <Database className="w-5 h-5 text-emerald-400" />
                NẠP TÀI LIỆU VÀO VECTOR DB (INGESTION)
              </h3>

              <form onSubmit={handleCreateDocument} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                    Tiêu đề tài liệu
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-[#070B13] border border-slate-800 rounded-xl p-3 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-700"
                    placeholder="ví dụ: agency-agents-overview.md"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                    Nội dung văn bản gốc
                  </label>
                  <textarea
                    rows={8}
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-[#070B13] border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500 custom-scrollbar placeholder:text-slate-700"
                    placeholder="Nhập hoặc dán nội dung văn bản thô cần nhúng vào cơ sở dữ liệu tri thức..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                    Commit Message khởi tạo
                  </label>
                  <input
                    type="text"
                    value={newCommitMsg}
                    onChange={(e) => setNewCommitMsg(e.target.value)}
                    className="bg-[#070B13] border border-slate-800 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-700"
                    placeholder="Mô tả phiên bản (ví dụ: Khởi tạo tri thức nền tảng)"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900/40 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition shadow-[0_0_10px_rgba(16,185,129,0.1)] cursor-pointer"
                  >
                    Nạp tri thức (Ingest)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </ProtectedRoute>
  );
}
