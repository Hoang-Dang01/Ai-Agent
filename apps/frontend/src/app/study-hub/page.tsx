"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, FileText, BrainCircuit, Mic, Plus, BookOpen, 
  User, Bot, Bookmark, HelpCircle, Loader2, RefreshCw
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth.context";

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  sources?: { title: string; document_id: string }[];
}

export default function StudyHubPage() {
  const { vibeMode, lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { token } = useAuth();
  const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';

  // Generate or fetch session ID on mount
  useEffect(() => {
    let id = sessionStorage.getItem("study_session_id");
    if (!id) {
      id = `session_${Date.now()}`;
      sessionStorage.setItem("study_session_id", id);
    }
    setSessionId(id);
  }, []);

  // Load persistent chat history on session/token mount
  useEffect(() => {
    if (!sessionId || !token) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${orchestratorUrl}/api/study-hub/history/${sessionId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json() as any;
          if (data.status === 'OK' && data.history) {
            const mappedMessages = data.history.map((h: any) => ({
              id: h.id,
              sender: h.senderType,
              text: h.message,
              timestamp: new Date(h.createdAt).toLocaleTimeString('en-US', { hour12: false }).substring(0, 5)
            }));
            setMessages(mappedMessages);
          }
        }
      } catch (err) {
        console.error("[StudyHub] Error loading chat history:", err);
      }
    };

    fetchHistory();
  }, [sessionId, token, orchestratorUrl]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle message sending
  const handleSendMessage = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const textToSend = customQuery || query;
    if (!textToSend.trim() || loading || !token) return;

    // Create user message object
    const userMsg: Message = {
      id: `${Date.now()}-user`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5)
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customQuery) setQuery("");
    setLoading(true);

    try {
      const res = await fetch(`${orchestratorUrl}/api/study-hub/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: textToSend,
          sessionId,
          agent: textToSend.toLowerCase().includes('code') ? 'code_mentor' : 'analytics_expert'
        })
      });

      if (!res.ok) throw new Error("Failed to communicate with proxy gateway");
      const data = await res.json() as any;

      // Create AI response object
      const aiMsg: Message = {
        id: data.message?.id || `${Date.now()}-ai`,
        sender: 'ai',
        text: data.output,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5)
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("[StudyHub] Proxy Chat error:", err);
      
      const errorMsg: Message = {
        id: `${Date.now()}-err`,
        sender: 'ai',
        text: `Đã xảy ra sự cố kết nối tới Cổng điều phối API (${err.message || err}). Vui lòng đảm bảo n8n và Orchestrator đang chạy.`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }).substring(0, 5)
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(undefined, suggestion);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <ProtectedRoute>
    <div className="flex-1 p-6 relative overflow-hidden flex flex-col h-full min-h-[500px]">
      {/* Background Cinematic Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
      
      {vibeMode && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[180px] pointer-events-none z-0"></div>
      )}

      {/* Main Study Hub Layout */}
      <div className="flex-1 flex flex-col relative z-10 w-full max-w-4xl mx-auto h-full bg-[#0F141F]/40 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-slate-200 font-bold text-sm tracking-wide uppercase font-mono">
                {lang === "vi" ? "TRỢ LÝ TẬP TRUNG RAG" : "RAG STUDY ASSISTANT"}
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Connected to local PostgreSQL vector embeddings
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button 
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs rounded-xl transition cursor-pointer font-bold font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Chat
            </button>
          )}
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 custom-scrollbar bg-black/10">
          {messages.length === 0 ? (
            /* Welcome / Onboarding Screen if chat is empty */
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
                <BrainCircuit className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                {lang === "vi" ? "Hôm nay bạn muốn nghiên cứu gì?" : "What would you like to study today?"}
              </h1>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-8">
                {lang === "vi" 
                  ? "Tôi đã kết nối trực tiếp với Kho Trí Thức tài liệu của bạn. Hãy gửi câu hỏi để tôi trích lục thông tin."
                  : "I am connected to your Vault database. Ask me any question and I will search semantic vector chunks."}
              </p>
              
              {/* Quick Action Suggestions */}
              <div className="flex flex-col gap-2.5 w-full max-w-md text-left">
                <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest pl-2 mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" /> Gợi ý nhanh (Shortcuts)
                </span>
                <button 
                  onClick={() => handleSuggestionClick(lang === "vi" ? "Kiểm tra mã số thuế và hướng dẫn ERP" : "Medstand ERP database guide")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/20 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 text-xs transition text-left cursor-pointer group"
                >
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate">{lang === "vi" ? "Cách kiểm tra mã số thuế của đối tác và đồng bộ ERP?" : "ERP integration instructions?"}</span>
                </button>
                <button 
                  onClick={() => handleSuggestionClick(lang === "vi" ? "Quy định thuế cá nhân đối với nhà thầu" : "Corporate tax rules")}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/20 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 text-xs transition text-left cursor-pointer group"
                >
                  <FileText className="w-4 h-4 text-purple-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate">{lang === "vi" ? "Tài liệu hướng dẫn quyết toán thuế cá nhân?" : "Personal income tax guidelines?"}</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* scrolling messages bubble logs */
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.sender === 'user' ? 'self-end flex-row-reverse text-right' : 'self-start text-left'
                  }`}
                >
                  {/* Avatar Icons */}
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border select-none ${
                    msg.sender === 'user'
                      ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble wrapper */}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                      msg.sender === 'user'
                        ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-100 rounded-tr-none'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 rounded-tl-none shadow-md'
                    }`}>
                      <p className="whitespace-pre-wrap select-text">{msg.text}</p>
                    </div>

                    {/* Sources / Citations display if present */}
                    {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 pl-1">
                        <span className="text-[9px] font-mono text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Bookmark className="w-3 h-3 text-slate-500" /> Citations:
                        </span>
                        {msg.sources.map((source, index) => (
                          <Link 
                            key={index}
                            href="/vault" 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-[10px] text-emerald-400 transition hover:scale-102"
                          >
                            <FileText className="w-3 h-3" />
                            <span className="max-w-[120px] truncate">{source.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Chat loading bubble indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 self-start text-left max-w-[80%]"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-none border border-slate-800 bg-slate-900/60 text-slate-500 text-xs flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Đang tìm kiếm và phân tích cơ sở tri thức...</span>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Omni-box Form */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/20">
          <form onSubmit={handleSendMessage} className="relative w-full flex items-center bg-[#070B13] border border-slate-800 hover:border-cyan-500/50 transition rounded-xl p-1.5 shadow-2xl">
            <button 
              type="button"
              className="p-2.5 text-slate-600 hover:text-cyan-400 transition cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              placeholder={lang === "vi" ? "Hỏi về hướng dẫn ERP, quyết toán thuế, cẩm nang nghiệp vụ..." : "Ask about ERP guides, business documents..."}
              className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-700 px-3 py-2 text-sm disabled:opacity-50"
            />
            <button 
              type="button"
              className="p-2.5 text-slate-600 hover:text-white transition cursor-pointer"
            >
              <Mic className="w-5 h-5" />
            </button>
            <button 
              type="submit"
              disabled={!query.trim() || loading}
              className={`p-2.5 ml-1.5 rounded-lg flex items-center justify-center transition cursor-pointer shrink-0 ${
                query.trim() && !loading
                  ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.15)]' 
                  : 'bg-slate-900 border border-slate-800/80 text-slate-700'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
