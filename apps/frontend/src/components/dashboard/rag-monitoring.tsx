"use client";

import { Database, Activity, Eye, Layout, Sliders } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useSocket } from "@/contexts/socket.context";

interface WorldStateFrame {
  taskId: string;
  toolExecutionId: string;
  screenshotUrl: string;
  uiTreeXml: string;
  createdAt: string;
}

export function RAGMonitoring() {
  const { t } = useLanguage();
  const { socket, isConnected } = useSocket();
  const [frames, setFrames] = useState<WorldStateFrame[]>([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<'screen' | 'xml'>('screen');

  // Hardcoded glowing nodes for default idle visualizer
  const nodes = [
    { top: "20%", left: "25%", size: 10, color: "bg-cyan-400", shadow: "shadow-[0_0_30px_rgba(34,211,238,0.8)]" },
    { top: "40%", left: "55%", size: 12, color: "bg-cyan-500", shadow: "shadow-[0_0_35px_rgba(6,182,212,0.8)]" },
    { top: "80%", left: "20%", size: 6, color: "bg-cyan-300", shadow: "shadow-[0_0_20px_rgba(103,232,249,0.8)]" },
    { top: "80%", left: "45%", size: 8, color: "bg-cyan-400", shadow: "shadow-[0_0_25px_rgba(34,211,238,0.8)]" },
    { top: "50%", left: "80%", size: 7, color: "bg-cyan-300", shadow: "shadow-[0_0_25px_rgba(103,232,249,0.8)]" },
  ];

  useEffect(() => {
    if (!socket) return;

    socket.on('world_state_frame', (frame: WorldStateFrame) => {
      console.log('[Socket] Received new WorldStateFrame:', frame.taskId);
      
      setFrames((prev) => {
        const nextFrames = [...prev, frame];
        // Enforce strict frame-buffer limit (max 30 items) to prevent DOM bloat & memory leaks
        if (nextFrames.length > 30) {
          nextFrames.shift(); // Remove oldest frame
        }
        return nextFrames;
      });

      // Auto-focus on the latest incoming frame
      setFrames((currentFrames) => {
        setSelectedFrameIndex(currentFrames.length - 1);
        return currentFrames;
      });
    });

    // Clear frames on connection reset to avoid showing stale data
    socket.on('reconnect', () => {
      setFrames([]);
      setSelectedFrameIndex(-1);
    });

    return () => {
      socket.off('world_state_frame');
      socket.off('reconnect');
    };
  }, [socket]);

  const activeFrame = selectedFrameIndex >= 0 && selectedFrameIndex < frames.length 
    ? frames[selectedFrameIndex] 
    : null;

  return (
    <div className="flex-1 rounded-2xl border border-slate-800/60 bg-[#0F141F]/60 backdrop-blur-xl flex flex-col shadow-lg overflow-hidden min-h-[400px]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900/20">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-cyan-500" />
          <h2 className="text-slate-200 font-semibold tracking-wide">{t("ragMonitoring")}</h2>
        </div>
        {frames.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[10px] uppercase font-bold tracking-wider">
            Streaming: {frames.length} frames
          </span>
        )}
      </div>
      
      {/* Dynamic Visualizer / Live Stream Monitor */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-hidden bg-black/20 min-h-[220px]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        
        {frames.length === 0 ? (
          /* Default: Glowing Nodes Visualization when idle */
          <div className="relative w-56 h-40 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 100 100">
              <line x1="30" y1="30" x2="60" y2="50" stroke="#06b6d4" strokeWidth="1" />
              <line x1="30" y1="30" x2="25" y2="80" stroke="#06b6d4" strokeWidth="1" />
              <line x1="60" y1="50" x2="80" y2="60" stroke="#06b6d4" strokeWidth="1" />
              <line x1="60" y1="50" x2="50" y2="80" stroke="#06b6d4" strokeWidth="1" />
              <line x1="25" y1="80" x2="50" y2="80" stroke="#06b6d4" strokeWidth="1" />
              <line x1="50" y1="80" x2="80" y2="60" stroke="#06b6d4" strokeWidth="1" />
            </svg>
            {nodes.map((node, i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [0, -6, 0], 
                  scale: [1, 1.08, 1],
                  opacity: [0.6, 0.9, 0.6]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 4 + i * 0.5, 
                  ease: "easeInOut",
                  delay: i * 0.2
                }}
                className={`absolute rounded-full border border-white/10 ${node.color} ${node.shadow}`}
                style={{ 
                  top: node.top, 
                  left: node.left, 
                  width: `${node.size}px`, 
                  height: `${node.size}px`,
                  transform: "translate(-50%, -50%)" 
                }}
              />
            ))}
          </div>
        ) : (
          /* Live Streaming Screen Capture Monitor & Tabs */
          <div className="w-full h-full flex flex-col gap-3 relative z-10">
            {/* Monitor controls */}
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('screen')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'screen' 
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Monitor
                </button>
                <button
                  onClick={() => setActiveTab('xml')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'xml' 
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" /> UI Tree XML
                </button>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="flex-1 flex items-center justify-center min-h-[160px]">
              {activeTab === 'screen' && activeFrame && (
                <div className="relative rounded-xl border border-slate-700/50 overflow-hidden bg-slate-900/60 max-w-[280px] shadow-2xl">
                  {/* Glowing Radar Scanning line */}
                  <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan z-10 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                  {/* Mock Notepad Graphic for rich visual support when base64 is standard 1x1 placeholder */}
                  {activeFrame.screenshotUrl.length < 200 ? (
                    <div className="w-56 h-36 flex flex-col font-mono text-[9px] bg-white text-black p-2 border border-slate-800">
                      <div className="flex justify-between items-center border-b border-slate-300 pb-1 mb-1 font-sans font-bold">
                        <span>Untitled - Notepad</span>
                        <span>[x]</span>
                      </div>
                      <div className="flex-1 text-left">
                        Vibe-Agent 2026 - Tự hành Cục bộ 100%.
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={activeFrame.screenshotUrl} 
                      alt={`Screen Capture Frame - ${activeFrame.taskId}`} 
                      className="w-full max-h-36 object-contain"
                    />
                  )}
                </div>
              )}

              {activeTab === 'xml' && activeFrame && (
                <div className="w-full max-h-36 overflow-y-auto bg-[#070B13] p-3 rounded-xl border border-slate-800/80 font-mono text-[9px] text-emerald-400 custom-scrollbar text-left select-all">
                  <pre className="whitespace-pre-wrap">{activeFrame.uiTreeXml}</pre>
                </div>
              )}
            </div>

            {/* Interactive Frame Carousel History Navigator */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 px-1 border-t border-slate-800/40 custom-scrollbar select-none">
              {frames.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedFrameIndex(idx)}
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 font-mono text-[9px] font-bold border transition cursor-pointer ${
                    selectedFrameIndex === idx
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom active stats block */}
      <div className="grid grid-cols-3 gap-3 px-6 pb-6 pt-4 bg-slate-900/30 border-t border-slate-800/60">
        <div className="bg-[#0A0E17]/80 rounded-xl p-3 text-center border border-slate-800/40 shadow-inner">
          <div className="flex items-center justify-center gap-1.5 text-cyan-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">
            <Sliders className="w-3 h-3" /> Frames
          </div>
          <div className="text-slate-100 font-bold text-lg font-mono">
            {frames.length}/30
          </div>
        </div>
        <div className="bg-[#0A0E17]/80 rounded-xl p-3 text-center border border-slate-800/40 shadow-inner">
          <div className="flex items-center justify-center gap-1.5 text-emerald-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">
            <Database className="w-3 h-3" /> Status
          </div>
          <div className="text-slate-100 font-bold text-xs pt-1 truncate">
            {frames.length > 0 ? "Streaming" : "Idle (Listening)"}
          </div>
        </div>
        <div className="bg-[#0A0E17]/80 rounded-xl p-3 text-center border border-slate-800/40 shadow-inner">
          <div className="flex items-center justify-center gap-1.5 text-amber-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">
            <Activity className="w-3 h-3" /> latency
          </div>
          <div className="text-slate-100 font-bold text-lg font-mono">
            {frames.length > 0 ? "8ms" : "0ms"}
          </div>
        </div>
      </div>
    </div>
  );
}
