"use client";
import { motion } from "framer-motion";
import { useState, useMemo, MouseEvent } from "react";
import { Trash2 } from "lucide-react";

export function LinearRegressionVisualizer() {
  const [points, setPoints] = useState<{id: number, x: number, y: number}[]>([
    { id: 1, x: 120, y: 290 },
    { id: 2, x: 160, y: 320 },
    { id: 3, x: 200, y: 270 },
    { id: 4, x: 240, y: 250 },
    { id: 5, x: 280, y: 260 },
    { id: 6, x: 320, y: 220 },
    { id: 7, x: 360, y: 240 },
    { id: 8, x: 400, y: 190 },
    { id: 9, x: 440, y: 210 },
    { id: 10, x: 480, y: 180 }
  ]);

  const handleSvgClick = (e: MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 400 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (x > 60 && y < 360) {
      setPoints([...points, { id: Date.now(), x, y }]);
    }
  };

  const regression = useMemo(() => {
    if (points.length < 2) return null;
    
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    const mathPoints = points.map(p => ({ x: p.x, y: 400 - p.y }));

    mathPoints.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    });

    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return null;

    const m = (n * sumXY - sumX * sumY) / denominator;
    const b = (sumY - m * sumX) / n;

    const meanY = sumY / n;
    let ssTot = 0, ssRes = 0;
    mathPoints.forEach(p => {
      const yPred = m * p.x + b;
      ssTot += Math.pow(p.y - meanY, 2);
      ssRes += Math.pow(p.y - yPred, 2);
    });
    
    const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);

    const x1 = 60;
    const y1 = 400 - (m * x1 + b);
    const x2 = 750;
    const y2 = 400 - (m * x2 + b);

    return { m, b, r2, lineCoords: { x1, y1, x2, y2 } };
  }, [points]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-wide uppercase text-cyan-400 flex items-center gap-3">
            Linear Regression (Live)
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Auto-Calcing
            </span>
          </h2>
          <p className="text-slate-400 text-sm">Đi tìm đường thẳng phù hợp nhất qua {points.length} điểm dữ liệu hiện tại.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-700 text-sm font-mono text-cyan-300 font-bold flex flex-col items-end gap-1 shadow-inner min-w-[140px]">
            {regression ? (
              <>
                <span>y = {(regression.m).toFixed(3)}x + {(regression.b).toFixed(1)}</span>
                <span className={regression.r2 > 0.7 ? "text-emerald-400" : "text-amber-400"}>
                  R² = {(regression.r2).toFixed(4)}
                </span>
              </>
            ) : (
              <span className="text-slate-500 text-center w-full">Cần ít nhất 2 điểm</span>
            )}
          </div>
          <button 
            onClick={() => setPoints([])}
            className="flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs font-bold transition-colors border border-red-500/20"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
          </button>
        </div>
      </div>

      <div className="w-full flex-1 min-h-[400px] bg-[#0A0E17] rounded-xl border border-slate-700 p-6 relative cursor-crosshair">
        <svg 
          viewBox="0 0 800 400" 
          className="w-full h-full overflow-visible"
          onClick={handleSvgClick}
        >
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1"/>
          </pattern>
          <rect width="800" height="400" fill="url(#grid)" />

          <path d="M 60 360 L 740 360" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
          <path d="M 60 360 L 60 40" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
          
          <text x="750" y="365" fill="#94a3b8" fontSize="14" fontWeight="bold">x</text>
          <text x="45" y="30" fill="#94a3b8" fontSize="14" fontWeight="bold">y</text>

          {regression && (
            <g>
              <motion.line 
                animate={{
                  x1: regression.lineCoords.x1,
                  y1: regression.lineCoords.y1,
                  x2: regression.lineCoords.x2,
                  y2: regression.lineCoords.y2
                }}
                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                stroke="rgba(34,211,238,0.3)" 
                strokeWidth="10" 
                style={{ filter: 'blur(4px)' }}
              />
              <motion.line 
                animate={{
                  x1: regression.lineCoords.x1,
                  y1: regression.lineCoords.y1,
                  x2: regression.lineCoords.x2,
                  y2: regression.lineCoords.y2
                }}
                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                stroke="#22d3ee" 
                strokeWidth="3" 
              />
            </g>
          )}

          <g fill="#0F141F" stroke="#cbd5e1" strokeWidth="2">
            {points.map((p, index) => (
              <motion.circle 
                key={p.id}
                initial={{ scale: 0, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 15,
                  delay: index === points.length - 1 ? 0 : 0
                }}
                cx={p.x} 
                cy={p.y} 
                r="6" 
                className="hover:fill-cyan-500 hover:stroke-cyan-400 transition-colors cursor-pointer"
              />
            ))}
          </g>

          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
}
