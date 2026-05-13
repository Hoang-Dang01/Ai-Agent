"use client";
import { motion } from "framer-motion";
import { useState, useMemo, MouseEvent } from "react";
import { Trash2 } from "lucide-react";

export function LogisticRegressionVisualizer() {
  // Trạng thái lưu trữ các điểm dữ liệu: y chỉ có thể là 0 hoặc 1
  const [points, setPoints] = useState<{id: number, x: number, y: number}[]>([
    { id: 1, x: 150, y: 0 },
    { id: 2, x: 220, y: 0 },
    { id: 3, x: 280, y: 0 },
    { id: 4, x: 350, y: 0 },
    { id: 5, x: 420, y: 1 },
    { id: 6, x: 490, y: 0 },
    { id: 7, x: 550, y: 1 },
    { id: 8, x: 620, y: 1 },
    { id: 9, x: 680, y: 1 },
    { id: 10, x: 720, y: 1 }
  ]);

  const handleSvgClick = (e: MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 400 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (x > 60 && x < 750) {
      // Nếu click ở nửa trên -> gán là Class 1 (Pass)
      // Nếu click ở nửa dưới -> gán là Class 0 (Fail)
      const yClass = clickY < 200 ? 1 : 0;
      setPoints([...points, { id: Date.now(), x, y: yClass }]);
    }
  };

  // Tính toán Logistic Regression (Gradient Descent)
  const regression = useMemo(() => {
    const n = points.length;
    // Cần ít nhất 1 điểm của mỗi class để vẽ đường
    const hasClass0 = points.some(p => p.y === 0);
    const hasClass1 = points.some(p => p.y === 1);
    
    if (n < 2 || !hasClass0 || !hasClass1) return null;

    // 1. Chuẩn hóa dữ liệu X (Normalization) để tránh tràn số (Overflow) khi tính e^-z
    let sumX = 0;
    points.forEach(p => sumX += p.x);
    const meanX = sumX / n;
    
    let sumSq = 0;
    points.forEach(p => sumSq += Math.pow(p.x - meanX, 2));
    const stdX = Math.sqrt(sumSq / n) || 1;

    // 2. Gradient Descent (Thuật toán giảm dần độ dốc)
    let w = 0; 
    let b = 0;
    const learningRate = 2.0; 
    const epochs = 1000;

    for (let e = 0; e < epochs; e++) {
      let dw = 0;
      let db = 0;
      
      for (let i = 0; i < n; i++) {
        const x_norm = (points[i].x - meanX) / stdX;
        const y_actual = points[i].y;
        
        // Z = Wx + b
        const z = w * x_norm + b;
        // Hàm kích hoạt Sigmoid: P = 1 / (1 + e^-z)
        const p_pred = 1 / (1 + Math.exp(-z));
        
        // Sai số
        const error = p_pred - y_actual;
        
        // Cập nhật Gradient
        dw += error * x_norm;
        db += error;
      }
      
      w -= learningRate * (dw / n);
      b -= learningRate * (db / n);
    }

    // 3. Tạo đường cong (Sigmoid Curve) để render lên SVG
    let pathD = "";
    // Chạy x từ 60 (gốc trục) đến 740 (cuối trục)
    for (let screenX = 60; screenX <= 740; screenX += 5) {
      const x_norm = (screenX - meanX) / stdX;
      const z = w * x_norm + b;
      const p = 1 / (1 + Math.exp(-z)); // Ra xác suất từ 0.0 -> 1.0
      
      // Chuyển xác suất P thành tọa độ y trên màn hình
      // P = 1 (Đậu) -> y = 60 (Cạnh trên)
      // P = 0 (Trượt) -> y = 360 (Cạnh dưới)
      const screenY = 360 - (p * 300);
      
      if (screenX === 60) {
        pathD += `M ${screenX} ${screenY}`;
      } else {
        pathD += ` L ${screenX} ${screenY}`;
      }
    }

    // Tìm điểm ranh giới (Decision Boundary) tại P = 0.5 (Z = 0)
    // Z = w * x_norm + b = 0  => x_norm = -b / w
    const boundaryXNorm = -b / w;
    const boundaryScreenX = (boundaryXNorm * stdX) + meanX;

    return { pathD, boundaryScreenX };
  }, [points]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-wide uppercase text-purple-400 flex items-center gap-3">
            Logistic Regression (Live)
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Gradient Descent
            </span>
          </h2>
          <p className="text-slate-400 text-sm">Đi tìm đường cong Sigmoid phân loại Nhị phân (0 hoặc 1) qua {points.length} điểm dữ liệu.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-700 text-sm font-mono text-purple-300 font-bold flex items-center justify-center shadow-inner min-w-[140px] h-10">
            {regression ? (
              <span>P = 1 / (1 + e⁻ᶻ)</span>
            ) : (
              <span className="text-slate-500 text-xs">Cần đủ 2 Class (0 và 1)</span>
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
        {/* Background Hướng Dẫn */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-[80px] px-8 z-0 opacity-20">
          <div className="text-center font-bold text-3xl text-emerald-500 tracking-widest uppercase">Class 1 (Pass)</div>
          <div className="text-center font-bold text-3xl text-rose-500 tracking-widest uppercase">Class 0 (Fail)</div>
        </div>

        <svg 
          viewBox="0 0 800 400" 
          className="w-full h-full overflow-visible relative z-10"
          onClick={handleSvgClick}
        >
          {/* Grid */}
          <pattern id="grid-log" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1"/>
          </pattern>
          <rect width="800" height="400" fill="url(#grid-log)" />

          {/* Boundaries (Y=0, Y=1) */}
          <path d="M 60 60 L 740 60" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" className="opacity-40" />
          <path d="M 60 360 L 740 360" fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="4 4" className="opacity-40" />

          {/* Axes */}
          <path d="M 60 360 L 740 360" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
          <path d="M 60 360 L 60 40" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
          
          <text x="750" y="365" fill="#94a3b8" fontSize="14" fontWeight="bold">x</text>
          <text x="45" y="30" fill="#94a3b8" fontSize="14" fontWeight="bold">P(y)</text>
          <text x="40" y="65" fill="#10b981" fontSize="12" fontWeight="bold">1.0</text>
          <text x="40" y="365" fill="#f43f5e" fontSize="12" fontWeight="bold">0.0</text>

          {/* Decision Boundary Line (Trục Cắt P=0.5) */}
          {regression && regression.boundaryScreenX > 60 && regression.boundaryScreenX < 740 && (
             <g>
               <motion.line 
                 initial={{ x1: regression.boundaryScreenX, x2: regression.boundaryScreenX }}
                 animate={{ x1: regression.boundaryScreenX, x2: regression.boundaryScreenX }}
                 transition={{ type: "spring", stiffness: 80, damping: 15 }}
                 y1="60" y2="360" 
                 stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="8 4" 
               />
               <motion.text 
                 initial={{ x: regression.boundaryScreenX + 10 }}
                 animate={{ x: regression.boundaryScreenX + 10 }}
                 transition={{ type: "spring", stiffness: 80, damping: 15 }}
                 y="210" fill="#94a3b8" fontSize="11" fontWeight="bold"
               >
                 Decision Boundary (50%)
               </motion.text>
             </g>
          )}

          {/* Draw Dynamic Sigmoid Curve (Glow + Smooth Morphing) */}
          {regression && (
            <g>
              <motion.path 
                animate={{ d: regression.pathD }}
                transition={{ type: "spring", stiffness: 60, damping: 12 }}
                fill="none"
                stroke="rgba(168,85,247,0.3)" 
                strokeWidth="10" 
                style={{ filter: 'blur(4px)' }}
              />
              <motion.path 
                animate={{ d: regression.pathD }}
                transition={{ type: "spring", stiffness: 60, damping: 12 }}
                fill="none"
                stroke="#a855f7" 
                strokeWidth="4" 
              />
            </g>
          )}

          {/* Data Points */}
          <g strokeWidth="2">
            {points.map((p, index) => {
              const screenY = p.y === 1 ? 60 : 360;
              const isClass1 = p.y === 1;

              return (
                <motion.circle 
                  key={p.id}
                  initial={{ scale: 0, opacity: 0, y: screenY === 60 ? -20 : 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 15,
                    delay: index === points.length - 1 ? 0 : 0 // Chỉ delay cho điểm vừa thêm
                  }}
                  cx={p.x} 
                  cy={screenY} 
                  r="7" 
                  className={isClass1 ? "fill-emerald-900 stroke-emerald-400" : "fill-rose-900 stroke-rose-400"}
                />
              )
            })}
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
