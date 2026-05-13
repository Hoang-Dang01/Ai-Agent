"use client";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { PlayCircle, Plus, Minus } from "lucide-react";

export function NeuralNetworksVisualizer() {
  // Trạng thái lưu trữ số node trong từng layer ẩn
  const [hiddenLayers, setHiddenLayers] = useState<number[]>([4, 3]);
  const inputNodes = 3;
  const outputNodes = 2;
  const [isInferencing, setIsInferencing] = useState(false);

  // Tạo cấu trúc topology
  const topology = useMemo(() => [inputNodes, ...hiddenLayers, outputNodes], [inputNodes, hiddenLayers, outputNodes]);

  const handleAddLayer = () => {
    if (hiddenLayers.length < 4) {
      setHiddenLayers([...hiddenLayers, 4]);
    }
  };

  const handleRemoveLayer = () => {
    if (hiddenLayers.length > 1) {
      setHiddenLayers(hiddenLayers.slice(0, -1));
    }
  };

  const handleChangeNode = (layerIndex: number, delta: number) => {
    const newLayers = [...hiddenLayers];
    const current = newLayers[layerIndex];
    if (current + delta > 0 && current + delta <= 8) {
      newLayers[layerIndex] = current + delta;
      setHiddenLayers(newLayers);
    }
  };

  const runInference = () => {
    if (isInferencing) return;
    setIsInferencing(true);
    setTimeout(() => {
      setIsInferencing(false);
    }, 2500);
  };

  // Tính toán tọa độ vẽ node
  const graph = useMemo(() => {
    const nodes: { id: string, cx: number, cy: number, layer: number }[] = [];
    const edges: { id: string, x1: number, y1: number, x2: number, y2: number, delay: number }[] = [];
    
    const layerWidth = 800 / (topology.length + 1);
    const centerY = 200; // Chiều cao viewbox là 400

    // Tạo Nodes
    topology.forEach((nodeCount, lIndex) => {
      const cx = layerWidth * (lIndex + 1);
      const spacing = 40;
      const startY = centerY - ((nodeCount - 1) * spacing) / 2;

      for (let n = 0; n < nodeCount; n++) {
        nodes.push({
          id: `L${lIndex}-N${n}`,
          cx,
          cy: startY + n * spacing,
          layer: lIndex
        });
      }
    });

    // Tạo Edges (Kết nối Full-connected)
    for (let l = 0; l < topology.length - 1; l++) {
      const currentLayerNodes = nodes.filter(n => n.layer === l);
      const nextLayerNodes = nodes.filter(n => n.layer === l + 1);

      currentLayerNodes.forEach(n1 => {
        nextLayerNodes.forEach(n2 => {
          edges.push({
            id: `E-${n1.id}-${n2.id}`,
            x1: n1.cx,
            y1: n1.cy,
            x2: n2.cx,
            y2: n2.cy,
            delay: l * 0.5 // Delay animation theo layer
          });
        });
      });
    }

    return { nodes, edges };
  }, [topology]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-wide uppercase text-amber-400 flex items-center gap-3">
            Multi-Layer Perceptron
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
              <span className={`w-1.5 h-1.5 bg-amber-400 rounded-full ${isInferencing ? 'animate-pulse' : ''}`}></span> Architecture
            </span>
          </h2>
          <p className="text-slate-400 text-sm">Xây dựng kiến trúc Mạng Nơ-ron nhân tạo và mô phỏng luồng lan truyền (Forward Pass).</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button 
              onClick={handleAddLayer}
              disabled={hiddenLayers.length >= 4}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded text-xs font-bold transition-colors border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm Layer
            </button>
            <button 
              onClick={handleRemoveLayer}
              disabled={hiddenLayers.length <= 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded text-xs font-bold transition-colors border border-slate-700"
            >
              <Minus className="w-3.5 h-3.5" /> Xóa Layer
            </button>
          </div>
          <button 
            onClick={runInference}
            disabled={isInferencing}
            className={`flex items-center justify-center gap-2 px-6 py-2 rounded font-bold transition-all ${isInferencing ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-amber-500 hover:bg-amber-400 text-[#0F141F] shadow-[0_0_15px_rgba(245,158,11,0.4)]'}`}
          >
            <PlayCircle className={`w-5 h-5 ${isInferencing ? 'animate-spin' : ''}`} /> 
            {isInferencing ? 'Đang lan truyền...' : 'Run Forward Pass'}
          </button>
        </div>
      </div>

      <div className="w-full flex-1 min-h-[400px] bg-[#0A0E17] rounded-xl border border-slate-700 p-6 relative overflow-hidden flex flex-col justify-center">
        {/* Lớp lưới tĩnh */}
        <div className="absolute inset-0 z-0">
          <svg width="100%" height="100%" className="opacity-20">
            <pattern id="grid-nn" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f59e0b" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid-nn)" />
          </svg>
        </div>

        {/* Cấu hình số Neuron từng Layer */}
        <div className="absolute top-4 left-0 w-full flex justify-around px-8 z-20">
          <div className="text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Input Layer</div>
            <div className="text-cyan-400 font-mono bg-slate-900/50 px-3 py-1 rounded border border-slate-800">{inputNodes} Features</div>
          </div>
          {hiddenLayers.map((count, idx) => (
            <div key={`h-config-${idx}`} className="text-center flex flex-col items-center gap-1">
              <div className="text-xs font-bold text-amber-500/70 uppercase tracking-widest">Hidden {idx + 1}</div>
              <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded border border-slate-700 backdrop-blur">
                <button onClick={() => handleChangeNode(idx, -1)} className="p-1 hover:text-white text-slate-400"><Minus className="w-3 h-3" /></button>
                <span className="text-amber-400 font-mono w-4">{count}</span>
                <button onClick={() => handleChangeNode(idx, 1)} className="p-1 hover:text-white text-slate-400"><Plus className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
          <div className="text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Output Layer</div>
            <div className="text-emerald-400 font-mono bg-slate-900/50 px-3 py-1 rounded border border-slate-800">{outputNodes} Classes</div>
          </div>
        </div>

        {/* SVG Vẽ Neural Network */}
        <svg viewBox="0 0 800 400" className="w-full h-full overflow-visible relative z-10 mt-8">
          
          {/* Các sợi dây liên kết tĩnh */}
          {graph.edges.map(edge => (
            <line 
              key={edge.id}
              x1={edge.x1} y1={edge.y1}
              x2={edge.x2} y2={edge.y2}
              stroke="#334155"
              strokeWidth="1"
              className="opacity-30"
            />
          ))}

          {/* Sợi dây phát sáng khi Inference */}
          {isInferencing && graph.edges.map(edge => (
            <motion.line 
              key={`glow-${edge.id}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 1, 0] }}
              transition={{ 
                duration: 0.8, 
                ease: "linear",
                delay: edge.delay,
                times: [0, 0.5, 1]
              }}
              x1={edge.x1} y1={edge.y1}
              x2={edge.x2} y2={edge.y2}
              stroke="#f59e0b"
              strokeWidth="2"
              style={{ filter: 'blur(1px)' }}
            />
          ))}

          {/* Các Nodes */}
          {graph.nodes.map(node => {
            const isInput = node.layer === 0;
            const isOutput = node.layer === topology.length - 1;
            
            let color = "fill-amber-900 stroke-amber-500";
            if (isInput) color = "fill-cyan-900 stroke-cyan-500";
            if (isOutput) color = "fill-emerald-900 stroke-emerald-500";

            return (
              <g key={node.id}>
                {isInferencing && (
                  <motion.circle 
                    initial={{ r: 12, opacity: 0 }}
                    animate={{ r: 25, opacity: [0, 0.5, 0] }}
                    transition={{ duration: 0.5, delay: node.layer * 0.5 + 0.3 }}
                    cx={node.cx} cy={node.cy} 
                    className={`${isInput ? 'fill-cyan-500' : isOutput ? 'fill-emerald-500' : 'fill-amber-500'}`}
                    style={{ filter: 'blur(5px)' }}
                  />
                )}
                <motion.circle 
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  cx={node.cx} 
                  cy={node.cy} 
                  r="12" 
                  strokeWidth="3"
                  className={`${color} relative z-20`}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
