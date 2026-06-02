"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Cpu, Sparkles, Database, HelpCircle } from "lucide-react";
import { useSocket } from "@/contexts/socket.context";

interface GraphNode {
  id: string;
  name: string;
  label: string;
  val: number;
  description: string;
}

interface GraphLink {
  id: string;
  source: string;
  target: string;
  label: string;
}

export function KnowledgeGraph3D({ vibeMode }: { vibeMode: boolean }) {
  const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchGraphData = useCallback(async () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${backendUrl}/api/graph/data`);
      if (!res.ok) throw new Error("Failed to fetch graph data");
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error("[Graph3D] Error fetching graph data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Nạp lần đầu và giữ cơ chế Polling 5000ms dự phòng (failover boundary)
  useEffect(() => {
    fetchGraphData();
    const interval = setInterval(fetchGraphData, 5000);
    return () => clearInterval(interval);
  }, [fetchGraphData]);

  // Đấu nối thời gian thực WebSocket Socket.io đẩy cập nhật từ Event Bus Redis
  useEffect(() => {
    if (!socket) return;
    
    const handleGraphUpdate = (payload: { versionId: string }) => {
      console.log(`[Galaxy Graph] Real-time RPGM updates received via Event Bus for version: ${payload.versionId}. Refetching graph data...`);
      fetchGraphData();
    };

    socket.on('graph_update_pushed', handleGraphUpdate);
    return () => {
      socket.off('graph_update_pushed', handleGraphUpdate);
    };
  }, [socket, fetchGraphData]);


  // Tính toán tọa độ phân bố đều của các node xung quanh tâm
  const positionedNodes = data.nodes.map((node, index) => {
    // Phân chia theo 3 mức vòng quỹ đạo
    const ring = index % 3;
    const radius = ring === 0 ? 110 : ring === 1 ? 190 : 270;
    
    const itemsInRing = Math.ceil(data.nodes.length / 3) || 1;
    const ringIndex = Math.floor(index / 3);
    const baseAngle = ringIndex * (360 / itemsInRing);
    const offsetAngle = ring * 20; // Độ lệch góc nghiêng
    const angle = (baseAngle + offsetAngle) * (Math.PI / 180);
    
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return {
      ...node,
      x,
      y,
      ring,
      baseAngle,
      offsetAngle
    };
  });

  return (
    <div className="flex-1 relative overflow-hidden bg-[#05080f] flex items-center justify-center min-h-[400px] lg:min-h-[550px]">
      {/* 3D Knowledge Graph Galaxy Container */}
      <div className="absolute inset-0 flex items-center justify-center scale-50 sm:scale-75 md:scale-90 lg:scale-100">
        
        {/* Central Core LLM Node */}
        <motion.div 
          animate={vibeMode ? { boxShadow: ["0 0 20px rgba(16,185,129,0.4)", "0 0 60px rgba(16,185,129,0.8)", "0 0 20px rgba(16,185,129,0.4)"] } : { boxShadow: "0 0 20px rgba(16,185,129,0.4)" }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center z-30 relative"
        >
          <Cpu className="w-8 h-8 text-emerald-400" />
          <div className="absolute -bottom-8 text-[10px] font-mono text-emerald-400 font-bold bg-black/60 px-2 py-1 rounded border border-emerald-500/20 backdrop-blur whitespace-nowrap">
            CORE_LLM
          </div>
        </motion.div>

        {/* SVG Edges Links Layer */}
        {!loading && positionedNodes.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            {data.links.map((link) => {
              // Tìm kiếm node nguồn và đích tương ứng
              const sourceNode = positionedNodes.find(n => n.id === link.source || n.name === link.source);
              const targetNode = positionedNodes.find(n => n.id === link.target || n.name === link.target);
              
              if (!sourceNode || !targetNode) return null;
              
              return (
                <g key={link.id} className="opacity-75">
                  {/* Cung liên kết chính */}
                  <motion.line
                    x1={`calc(50% + ${sourceNode.x}px)`}
                    y1={`calc(50% + ${sourceNode.y}px)`}
                    x2={`calc(50% + ${targetNode.x}px)`}
                    y2={`calc(50% + ${targetNode.y}px)`}
                    stroke="rgba(16,185,129,0.25)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                  />
                  {/* Hiệu ứng xung truyền phát thông tin sáng tạo giữa 2 thực thể */}
                  <motion.circle
                    r="3"
                    fill="#34d399"
                    className="shadow-[0_0_8px_rgba(52,211,153,1)]"
                    animate={{
                      cx: [
                        `calc(50% + ${sourceNode.x}px)`, 
                        `calc(50% + ${targetNode.x}px)`
                      ],
                      cy: [
                        `calc(50% + ${sourceNode.y}px)`, 
                        `calc(50% + ${targetNode.y}px)`
                      ],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Render Real Nodes */}
        {!loading && positionedNodes.map((n, i) => {
          const nodeSize = n.ring === 0 ? "w-9 h-9" : n.ring === 1 ? "w-8 h-8" : "w-7 h-7";
          const dotSize = n.ring === 0 ? "w-2.5 h-2.5" : n.ring === 1 ? "w-2 h-2" : "w-1.5 h-1.5";
          
          return (
            <motion.div
              key={n.id}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ x: n.x, y: n.y, opacity: 1 }}
              transition={{ delay: i * 0.03, duration: 1.2, type: "spring", stiffness: 45 }}
              className="absolute z-20"
            >
              {/* Cung mờ kết nối gián tiếp node tới Core LLM */}
              <svg 
                className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" 
                style={{ transform: `translate(-50%, -50%) rotate(${n.baseAngle + n.offsetAngle + 180}deg)` }}
              >
                <line 
                  x1="50%" y1="50%" x2="50%" y2="0" 
                  stroke="rgba(16,185,129,0.06)" 
                  strokeWidth="1"
                  strokeDasharray="2 6"
                />
              </svg>

              {/* Node Button/Circle */}
              <div 
                className={`${nodeSize} rounded-full bg-slate-950 border border-slate-700/80 flex items-center justify-center relative group cursor-pointer hover:border-emerald-400 hover:bg-emerald-950/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all duration-300 hover:scale-125`}
              >
                <div 
                  className={`${dotSize} rounded-full transition-colors ${
                    n.label === "Tool" ? "bg-cyan-400 group-hover:bg-cyan-300" :
                    n.label === "Application" ? "bg-purple-500 group-hover:bg-purple-400" :
                    "bg-emerald-400 group-hover:bg-emerald-300"
                  }`}
                />
                
                {/* Visual Tooltip Hover Details Card */}
                <div className="absolute bottom-full mb-3.5 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 duration-200 bg-slate-950/95 text-slate-300 p-3.5 border border-emerald-500/30 rounded-xl backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.8)] pointer-events-none text-left min-w-[200px] max-w-[280px] z-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      {n.label}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]"></span>
                  </div>
                  <div className="font-bold text-sm text-slate-100 truncate mb-1">
                    {n.name}
                  </div>
                  {n.description && (
                    <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">
                      {n.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="absolute text-slate-500 text-xs italic">
            Connecting to Vault Galaxy...
          </div>
        )}

        {/* Empty State Fallback Orbit Rings */}
        {!loading && data.nodes.length === 0 && (
          <>
            <div className="absolute border border-emerald-500/10 rounded-full w-[220px] h-[220px] pointer-events-none animate-spin" style={{ animationDuration: "15s" }}></div>
            <div className="absolute border border-emerald-500/5 rounded-full w-[380px] h-[380px] pointer-events-none animate-spin" style={{ animationDuration: "25s", animationDirection: "reverse" }}></div>
            <div className="absolute text-slate-500 text-xs font-mono select-none pointer-events-none bg-[#05080f] px-4 py-2 border border-slate-900 rounded-lg">
              Chưa có thực thể. Hãy ingest tài liệu.
            </div>
          </>
        )}
      </div>

      {/* Floating Info Overlay panel (Real-Time Stats) */}
      <div className="absolute bottom-6 right-6 hidden sm:flex flex-col gap-2 pointer-events-none select-none">
        <div className="bg-[#0A0E17]/85 backdrop-blur border border-emerald-900/40 rounded-2xl p-4 shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">RPGM GraphRAG Metrics</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs text-slate-400 gap-10">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                Entities (Nodes):
              </span>
              <span className="font-mono text-white font-bold">{data.nodes.length}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 gap-10">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-500" />
                Relations (Edges):
              </span>
              <span className="font-mono text-white font-bold">{data.links.length}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 gap-10">
              <span>Graph Ingress:</span>
              <span className="font-mono text-emerald-400 font-semibold">Active RPGM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
