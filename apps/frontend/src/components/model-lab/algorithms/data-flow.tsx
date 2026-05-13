"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { 
  User, ShieldCheck, HardDrive, Edit3, Fingerprint, 
  Database, Archive, Layers, FileCode, BrainCircuit, 
  ShieldAlert, MessageSquare, PlayCircle, RotateCcw
} from "lucide-react";

export function DataFlowVisualizer() {
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  const runSimulation = () => {
    if (step !== 0) return;
    setLogs(["[SYSTEM] Khởi chạy Enterprise RAG Pipeline (Full Cycle)..."]);
    setStep(1);
    
    setTimeout(() => {
      addLog("[1. INPUT GUARDRAIL] Quét PII (Dữ liệu nhạy cảm) & Độc tính. Trạng thái: An toàn.");
      setStep(2);
    }, 1500);

    setTimeout(() => {
      addLog("[2. SEMANTIC CACHE] Kiểm tra Redis Cache. Trạng thái: Cache Miss (Chưa từng hỏi).");
      setStep(3);
    }, 3000);

    setTimeout(() => {
      addLog("[3. QUERY REWRITER] Viết lại câu hỏi. Gốc: 'Doanh thu Q3?' -> Mở rộng: 'Báo cáo tài chính doanh thu quý 3 năm 2023'.");
      setStep(4);
    }, 4500);

    setTimeout(() => {
      addLog("[4. EMBEDDING] Text -> Vector: [0.12, -0.45, ... 1536 dims]. Model: text-embedding-3-large.");
      setStep(5);
    }, 6000);

    setTimeout(() => {
      addLog("[5. VECTOR SEARCH] ANN Search trên Neo4j. Tìm thấy Top 10 Chunk IDs gần nhất.");
      setStep(6);
    }, 7500);

    setTimeout(() => {
      addLog("[6. DOC STORE] Truy xuất 10 văn bản thô (Raw Payload) từ Document Store (NoSQL).");
      setStep(7);
    }, 9000);

    setTimeout(() => {
      addLog("[7. RE-RANKER] Cross-Encoder chấm điểm lại 10 Chunks so với Query. Lọc lấy Top 3 tốt nhất.");
      setStep(8);
    }, 10500);

    setTimeout(() => {
      addLog("[8. PROMPT COMPILER] Lắp ráp: [System Prompt] + [Top 3 Chunks Context] + [User Query].");
      setStep(9);
    }, 12000);

    setTimeout(() => {
      addLog("[9. LLM ENGINE] Truyền context vào Core LLM. Đang Streaming Text Generation...");
      setStep(10);
    }, 14000);

    setTimeout(() => {
      addLog("[10. OUTPUT GUARDRAIL] Kiểm tra Hallucination (Ảo giác) với Fact-Checker. Trạng thái: Pass.");
      setStep(11);
    }, 16000);

    setTimeout(() => {
      addLog("[11. RESPONSE] Trả luồng dữ liệu (Stream) về giao diện người dùng.");
      setStep(12); // Xong
    }, 18000);
  };

  const resetSimulation = () => {
    setStep(0);
    setLogs([]);
  };

  // Sơ đồ hình chữ U: Lượt đi hàng trên (Trái -> Phải), Lượt về hàng dưới (Phải -> Trái)
  const nodes = {
    user:         { x: 80,  y: 80,  label: "User App",        icon: User,          color: "slate" },
    guardrailIn:  { x: 230, y: 80,  label: "Input Guard",     icon: ShieldCheck,   color: "green" },
    cache:        { x: 380, y: 80,  label: "Semantic Cache",  icon: HardDrive,     color: "blue" },
    rewriter:     { x: 530, y: 80,  label: "Query Rewriter",  icon: Edit3,         color: "cyan" },
    embed:        { x: 680, y: 80,  label: "Embedding",       icon: Fingerprint,   color: "amber" },
    vectordb:     { x: 830, y: 80,  label: "Vector DB",       icon: Database,      color: "purple" },
    
    docstore:     { x: 830, y: 260, label: "Doc Store",       icon: Archive,       color: "orange" },
    reranker:     { x: 680, y: 260, label: "Re-ranker",       icon: Layers,        color: "rose" },
    prompt:       { x: 530, y: 260, label: "Prompt Builder",  icon: FileCode,      color: "indigo" },
    llm:          { x: 380, y: 260, label: "Core LLM",        icon: BrainCircuit,  color: "emerald" },
    guardrailOut: { x: 230, y: 260, label: "Output Guard",    icon: ShieldAlert,   color: "green" },
    output:       { x: 80,  y: 260, label: "Final Response",  icon: MessageSquare, color: "slate" },
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-wide uppercase text-blue-400 flex items-center gap-3">
            Enterprise RAG Data Flow
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
              <span className={`w-1.5 h-1.5 bg-rose-400 rounded-full ${step > 0 && step < 12 ? 'animate-pulse' : ''}`}></span> Hyper-Detailed
            </span>
          </h2>
          <p className="text-slate-400 text-sm">Mô phỏng chính xác từng vi mạch xử lý của một hệ thống RAG thực tế trong công nghiệp.</p>
        </div>
        <div className="flex gap-3">
          {step === 12 || step === 0 ? (
            <button 
              onClick={step === 12 ? resetSimulation : runSimulation}
              className={`flex items-center justify-center gap-2 px-6 py-2 rounded font-bold transition-all ${step === 12 ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-600' : 'bg-blue-500 hover:bg-blue-400 text-[#0F141F] shadow-[0_0_15px_rgba(59,130,246,0.4)]'}`}
            >
              {step === 12 ? <RotateCcw className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
              {step === 12 ? 'Reset Flow' : 'Run Deep Simulation'}
            </button>
          ) : (
            <button disabled className="flex items-center justify-center gap-2 px-6 py-2 rounded font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Processing ({step}/11)...
            </button>
          )}
        </div>
      </div>

      <div className="w-full flex-1 min-h-[480px] bg-[#0A0E17] rounded-xl border border-slate-700 p-6 relative overflow-hidden flex flex-col justify-center">
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 opacity-20">
          <svg width="100%" height="100%">
            <pattern id="grid-rag-pro" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#475569" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid-rag-pro)" />
          </svg>
        </div>

        {/* Console Logs */}
        <div className="absolute bottom-4 left-4 right-4 h-32 bg-[#05080f]/95 backdrop-blur border border-slate-800 rounded-lg p-4 z-30 font-mono text-[11px] overflow-y-auto flex flex-col gap-2 shadow-2xl custom-scrollbar leading-relaxed">
          {logs.length === 0 ? (
            <span className="text-slate-600">Sẵn sàng mô phỏng luồng RAG cấp độ doanh nghiệp...</span>
          ) : (
            logs.map((l, i) => {
              let color = "text-slate-300";
              if (l.includes("GUARDRAIL")) color = "text-green-400";
              if (l.includes("CACHE")) color = "text-blue-400";
              if (l.includes("REWRITER")) color = "text-cyan-400";
              if (l.includes("EMBEDDING")) color = "text-amber-400";
              if (l.includes("VECTOR SEARCH")) color = "text-purple-400";
              if (l.includes("DOC STORE")) color = "text-orange-400";
              if (l.includes("RE-RANKER")) color = "text-rose-400";
              if (l.includes("PROMPT COMPILER")) color = "text-indigo-400";
              if (l.includes("LLM ENGINE")) color = "text-emerald-400 font-bold";
              if (l.includes("RESPONSE")) color = "text-slate-100 font-bold";
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 ${color}`}>
                  <span className="text-slate-600">[{new Date().toISOString().split('T')[1].slice(0,-1)}]</span>
                  <span>{l}</span>
                </motion.div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>

        <div className="w-full flex-1 relative z-10 flex items-center justify-center -mt-16">
          <svg viewBox="0 0 910 340" className="w-full h-full overflow-visible">
            
            {/* --- STATIC PATHS --- */}
            <g stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" fill="none">
              <line x1={nodes.user.x} y1={nodes.user.y} x2={nodes.guardrailIn.x} y2={nodes.guardrailIn.y} />
              <line x1={nodes.guardrailIn.x} y1={nodes.guardrailIn.y} x2={nodes.cache.x} y2={nodes.cache.y} />
              <line x1={nodes.cache.x} y1={nodes.cache.y} x2={nodes.rewriter.x} y2={nodes.rewriter.y} />
              <line x1={nodes.rewriter.x} y1={nodes.rewriter.y} x2={nodes.embed.x} y2={nodes.embed.y} />
              <line x1={nodes.embed.x} y1={nodes.embed.y} x2={nodes.vectordb.x} y2={nodes.vectordb.y} />
              <line x1={nodes.vectordb.x} y1={nodes.vectordb.y} x2={nodes.docstore.x} y2={nodes.docstore.y} />
              <line x1={nodes.docstore.x} y1={nodes.docstore.y} x2={nodes.reranker.x} y2={nodes.reranker.y} />
              <line x1={nodes.reranker.x} y1={nodes.reranker.y} x2={nodes.prompt.x} y2={nodes.prompt.y} />
              <line x1={nodes.prompt.x} y1={nodes.prompt.y} x2={nodes.llm.x} y2={nodes.llm.y} />
              <line x1={nodes.llm.x} y1={nodes.llm.y} x2={nodes.guardrailOut.x} y2={nodes.guardrailOut.y} />
              <line x1={nodes.guardrailOut.x} y1={nodes.guardrailOut.y} x2={nodes.output.x} y2={nodes.output.y} />
            </g>

            {/* --- GLOWING PATHS (ANIMATED) --- */}
            <g fill="none">
              {step >= 1 && <motion.line x1={nodes.user.x} y1={nodes.user.y} x2={nodes.guardrailIn.x} y2={nodes.guardrailIn.y} stroke="#22c55e" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />}
              {step >= 2 && <motion.line x1={nodes.guardrailIn.x} y1={nodes.guardrailIn.y} x2={nodes.cache.x} y2={nodes.cache.y} stroke="#3b82f6" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />}
              {step >= 3 && <motion.line x1={nodes.cache.x} y1={nodes.cache.y} x2={nodes.rewriter.x} y2={nodes.rewriter.y} stroke="#06b6d4" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />}
              {step >= 4 && <motion.line x1={nodes.rewriter.x} y1={nodes.rewriter.y} x2={nodes.embed.x} y2={nodes.embed.y} stroke="#f59e0b" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />}
              {step >= 5 && <motion.line x1={nodes.embed.x} y1={nodes.embed.y} x2={nodes.vectordb.x} y2={nodes.vectordb.y} stroke="#a855f7" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />}
              {step >= 6 && <motion.line x1={nodes.vectordb.x} y1={nodes.vectordb.y} x2={nodes.docstore.x} y2={nodes.docstore.y} stroke="#f97316" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />}
              {step >= 7 && <motion.line x1={nodes.docstore.x} y1={nodes.docstore.y} x2={nodes.reranker.x} y2={nodes.reranker.y} stroke="#f43f5e" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} strokeDasharray="5 5" />}
              {step >= 8 && <motion.line x1={nodes.reranker.x} y1={nodes.reranker.y} x2={nodes.prompt.x} y2={nodes.prompt.y} stroke="#6366f1" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />}
              {step >= 9 && <motion.line x1={nodes.prompt.x} y1={nodes.prompt.y} x2={nodes.llm.x} y2={nodes.llm.y} stroke="#10b981" strokeWidth="4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />}
              {step >= 10 && <motion.line x1={nodes.llm.x} y1={nodes.llm.y} x2={nodes.guardrailOut.x} y2={nodes.guardrailOut.y} stroke="#22c55e" strokeWidth="4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />}
              {step >= 11 && <motion.line x1={nodes.guardrailOut.x} y1={nodes.guardrailOut.y} x2={nodes.output.x} y2={nodes.output.y} stroke="#f8fafc" strokeWidth="4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />}
            </g>

            {/* --- DATA PARTICLES --- */}
            <AnimatePresence>
              {step === 1 && <motion.circle r="6" fill="#22c55e" animate={{ cx: [nodes.user.x, nodes.guardrailIn.x], cy: [nodes.user.y, nodes.guardrailIn.y] }} transition={{ duration: 1 }} />}
              {step === 2 && <motion.circle r="6" fill="#3b82f6" animate={{ cx: [nodes.guardrailIn.x, nodes.cache.x], cy: [nodes.guardrailIn.y, nodes.cache.y] }} transition={{ duration: 1 }} />}
              {step === 3 && <motion.circle r="6" fill="#06b6d4" animate={{ cx: [nodes.cache.x, nodes.rewriter.x], cy: [nodes.cache.y, nodes.rewriter.y] }} transition={{ duration: 1 }} />}
              {step === 4 && <motion.circle r="6" fill="#f59e0b" animate={{ cx: [nodes.rewriter.x, nodes.embed.x], cy: [nodes.rewriter.y, nodes.embed.y] }} transition={{ duration: 1 }} />}
              {step === 5 && <motion.circle r="6" fill="#a855f7" animate={{ cx: [nodes.embed.x, nodes.vectordb.x], cy: [nodes.embed.y, nodes.vectordb.y] }} transition={{ duration: 1 }} />}
              {step === 6 && <motion.circle r="6" fill="#f97316" animate={{ cx: [nodes.vectordb.x, nodes.docstore.x], cy: [nodes.vectordb.y, nodes.docstore.y] }} transition={{ duration: 1 }} />}
              
              {/* DocStore returns 10 chunks to Reranker */}
              {step === 7 && (
                <motion.g animate={{ x: [nodes.docstore.x, nodes.reranker.x], y: [nodes.docstore.y, nodes.reranker.y] }} transition={{ duration: 1 }}>
                  <circle r="6" fill="#f43f5e" /><circle r="4" fill="#fff" cx="-10" /><circle r="4" fill="#fff" cx="10" />
                </motion.g>
              )}
              
              {/* Reranker returns 3 chunks to Prompt Builder */}
              {step === 8 && (
                <motion.g animate={{ x: [nodes.reranker.x, nodes.prompt.x], y: [nodes.reranker.y, nodes.prompt.y] }} transition={{ duration: 1 }}>
                  <circle r="6" fill="#6366f1" /><circle r="4" fill="#fff" cx="-8" />
                </motion.g>
              )}
              
              {step === 9 && <motion.circle r="8" fill="#10b981" animate={{ cx: [nodes.prompt.x, nodes.llm.x], cy: [nodes.prompt.y, nodes.llm.y] }} transition={{ duration: 1 }} />}
              {step === 10 && <motion.circle r="8" fill="#22c55e" animate={{ cx: [nodes.llm.x, nodes.guardrailOut.x], cy: [nodes.llm.y, nodes.guardrailOut.y] }} transition={{ duration: 1 }} />}
              {step === 11 && <motion.circle r="8" fill="#f8fafc" animate={{ cx: [nodes.guardrailOut.x, nodes.output.x], cy: [nodes.guardrailOut.y, nodes.output.y] }} transition={{ duration: 1 }} />}
            </AnimatePresence>

            {/* --- TOOLTIPS --- */}
            <AnimatePresence>
              {step === 2 && (
                <motion.foreignObject initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} x="300" y="20" width="160" height="40">
                  <div className="bg-blue-900/80 border border-blue-500 text-blue-100 text-[9px] p-1.5 rounded-lg shadow-lg backdrop-blur text-center font-mono">
                    CACHE_MISS (Key not found)
                  </div>
                </motion.foreignObject>
              )}
              {step === 5 && (
                <motion.foreignObject initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} x="700" y="20" width="160" height="40">
                  <div className="bg-purple-900/80 border border-purple-500 text-purple-100 text-[9px] p-1.5 rounded-lg shadow-lg backdrop-blur text-center font-mono">
                    SELECT chunk_id FROM docs ORDER BY vector_sim DESC LIMIT 10
                  </div>
                </motion.foreignObject>
              )}
              {step === 8 && (
                <motion.foreignObject initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} x="570" y="310" width="160" height="40">
                  <div className="bg-rose-900/80 border border-rose-500 text-rose-100 text-[9px] p-1.5 rounded-lg shadow-lg backdrop-blur text-center font-mono">
                    CrossEncoder.score(query, chunks) -&gt; Keep Top 3
                  </div>
                </motion.foreignObject>
              )}
            </AnimatePresence>

            {/* --- RENDER NODES --- */}
            {Object.entries(nodes).map(([key, n]) => {
              let glow = "";
              let scale = 1;
              const iconColor = `text-${n.color}-400`;
              let borderColor = "border-slate-700";

              // Kích hoạt màu khi step chạy qua
              if (
                (key === 'user' && step >= 1) ||
                (key === 'guardrailIn' && step >= 2) ||
                (key === 'cache' && step >= 3) ||
                (key === 'rewriter' && step >= 4) ||
                (key === 'embed' && step >= 5) ||
                (key === 'vectordb' && step >= 6) ||
                (key === 'docstore' && step >= 7) ||
                (key === 'reranker' && step >= 8) ||
                (key === 'prompt' && step >= 9) ||
                (key === 'llm' && step >= 10) ||
                (key === 'guardrailOut' && step >= 11) ||
                (key === 'output' && step >= 12)
              ) {
                glow = `shadow-[0_0_25px_rgba(255,255,255,0.1)]`;
                borderColor = `border-${n.color}-500`;
                scale = 1.05;
              }

              // Pulse cực đại tại LLM
              if (key === 'llm' && step === 10) {
                scale = 1.3;
                glow = `shadow-[0_0_50px_#10b981]`;
              }

              return (
                <foreignObject key={key} x={n.x - 45} y={n.y - 45} width="90" height="110" className="overflow-visible">
                  <motion.div 
                    animate={{ scale }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="flex flex-col items-center justify-center gap-2"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-[#0F141F] border-2 ${borderColor} flex items-center justify-center ${glow} transition-all duration-300 relative z-20`}>
                      <n.icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div className={`text-[9px] font-bold ${borderColor !== 'border-slate-700' ? iconColor : 'text-slate-500'} whitespace-nowrap bg-black/80 px-2 py-1 rounded backdrop-blur border border-slate-800 shadow-xl`}>
                      {n.label}
                    </div>
                  </motion.div>
                </foreignObject>
              );
            })}

          </svg>
        </div>
      </div>
    </div>
  );
}
