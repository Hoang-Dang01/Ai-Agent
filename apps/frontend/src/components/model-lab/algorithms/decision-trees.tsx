"use client";
import { motion } from "framer-motion";
import { useState, useMemo, MouseEvent } from "react";
import { Trash2 } from "lucide-react";

type Point = { id: number, x: number, y: number, c: number };
type Split = { axis: 'x' | 'y', val: number, gini: number, isRoot?: boolean };
type Region = { xMin: number, xMax: number, yMin: number, yMax: number, dominantClass: number };

export function DecisionTreesVisualizer() {
  // Trạng thái lưu trữ các điểm dữ liệu (c=0: Class A, c=1: Class B)
  const [points, setPoints] = useState<Point[]>([
    { id: 1, x: 200, y: 150, c: 0 },
    { id: 2, x: 250, y: 180, c: 0 },
    { id: 3, x: 300, y: 120, c: 0 },
    { id: 4, x: 450, y: 300, c: 1 },
    { id: 5, x: 500, y: 320, c: 1 },
    { id: 6, x: 550, y: 280, c: 1 },
  ]);

  // Click handler
  const handleSvgClick = (e: MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 400 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (x > 60 && x < 750 && y > 40 && y < 360) {
      // Dùng phím Shift hoặc Alt để đổi Class (hoặc đơn giản là chia nửa màn hình click cho lẹ)
      // Tạm thời: Click bên nửa trái màn hình ra Class 0, nửa phải ra Class 1 để test, 
      // Nhưng tốt nhất là click chuột trái / phải. Ở đây mình xài toạ độ để phán đoán ý người dùng hoặc đổi class tự động
      const c = e.shiftKey ? 1 : 0; // Nhấn shift để vẽ class 1
      setPoints([...points, { id: Date.now(), x, y, c }]);
    }
  };

  // Helper tính Gini Impurity
  const getGini = (pts: Point[]) => {
    if (pts.length === 0) return 0;
    let c0 = 0, c1 = 0;
    for (const p of pts) { if (p.c === 0) c0++; else c1++; }
    const p0 = c0 / pts.length;
    const p1 = c1 / pts.length;
    return 1 - (p0 * p0 + p1 * p1);
  };

  const getDominantClass = (pts: Point[]) => {
    if (pts.length === 0) return -1;
    let c0 = 0, c1 = 0;
    for (const p of pts) { if (p.c === 0) c0++; else c1++; }
    return c0 >= c1 ? 0 : 1;
  }

  // Tìm Split tốt nhất cho 1 tập điểm
  const findBestSplit = (pts: Point[]) => {
    let bestGini = 999;
    let bestSplit: Split | null = null;
    let leftPts: Point[] = [];
    let rightPts: Point[] = [];

    // Tìm trên trục X
    const xs = [...new Set(pts.map(p => p.x))].sort((a,b)=>a-b);
    for(let i=0; i<xs.length-1; i++) {
       const splitVal = (xs[i] + xs[i+1])/2;
       const left = pts.filter(p => p.x < splitVal);
       const right = pts.filter(p => p.x >= splitVal);
       const gini = (left.length * getGini(left) + right.length * getGini(right)) / pts.length;
       if (gini < bestGini) { bestGini = gini; bestSplit = { axis: 'x', val: splitVal, gini }; leftPts = left; rightPts = right; }
    }
    // Tìm trên trục Y
    const ys = [...new Set(pts.map(p => p.y))].sort((a,b)=>a-b);
    for(let i=0; i<ys.length-1; i++) {
       const splitVal = (ys[i] + ys[i+1])/2;
       const left = pts.filter(p => p.y < splitVal);
       const right = pts.filter(p => p.y >= splitVal);
       const gini = (left.length * getGini(left) + right.length * getGini(right)) / pts.length;
       if (gini < bestGini) { bestGini = gini; bestSplit = { axis: 'y', val: splitVal, gini }; leftPts = left; rightPts = right; }
    }
    return { split: bestSplit, leftPts, rightPts };
  };

  // Tính toán CART Tree (Depth = 2)
  const treeModel = useMemo(() => {
    const splits: Split[] = [];
    const regions: Region[] = [];

    if (points.length < 2) return { splits, regions };

    const initialGini = getGini(points);
    if (initialGini === 0) {
      regions.push({ xMin: 60, xMax: 740, yMin: 40, yMax: 360, dominantClass: points[0].c });
      return { splits, regions };
    }

    // Depth 1 (Root)
    const root = findBestSplit(points);
    if (!root.split) return { splits, regions };
    
    root.split.isRoot = true;
    splits.push(root.split);

    // Xác định 2 vùng bounding box sau lần cắt đầu tiên
    let leftRegion: Region, rightRegion: Region;
    if (root.split.axis === 'x') {
      leftRegion = { xMin: 60, xMax: root.split.val, yMin: 40, yMax: 360, dominantClass: getDominantClass(root.leftPts) };
      rightRegion = { xMin: root.split.val, xMax: 740, yMin: 40, yMax: 360, dominantClass: getDominantClass(root.rightPts) };
    } else {
      leftRegion = { xMin: 60, xMax: 740, yMin: 40, yMax: root.split.val, dominantClass: getDominantClass(root.leftPts) };
      rightRegion = { xMin: 60, xMax: 740, yMin: root.split.val, yMax: 360, dominantClass: getDominantClass(root.rightPts) };
    }

    // Depth 2 (Left Node)
    if (getGini(root.leftPts) > 0) {
      const leftChild = findBestSplit(root.leftPts);
      if (leftChild.split) {
        splits.push(leftChild.split);
        if (leftChild.split.axis === 'x') {
          regions.push({ ...leftRegion, xMax: leftChild.split.val, dominantClass: getDominantClass(leftChild.leftPts) });
          regions.push({ ...leftRegion, xMin: leftChild.split.val, dominantClass: getDominantClass(leftChild.rightPts) });
        } else {
          regions.push({ ...leftRegion, yMax: leftChild.split.val, dominantClass: getDominantClass(leftChild.leftPts) });
          regions.push({ ...leftRegion, yMin: leftChild.split.val, dominantClass: getDominantClass(leftChild.rightPts) });
        }
      } else { regions.push(leftRegion); }
    } else { regions.push(leftRegion); }

    // Depth 2 (Right Node)
    if (getGini(root.rightPts) > 0) {
      const rightChild = findBestSplit(root.rightPts);
      if (rightChild.split) {
        splits.push(rightChild.split);
        if (rightChild.split.axis === 'x') {
          regions.push({ ...rightRegion, xMax: rightChild.split.val, dominantClass: getDominantClass(rightChild.leftPts) });
          regions.push({ ...rightRegion, xMin: rightChild.split.val, dominantClass: getDominantClass(rightChild.rightPts) });
        } else {
          regions.push({ ...rightRegion, yMax: rightChild.split.val, dominantClass: getDominantClass(rightChild.leftPts) });
          regions.push({ ...rightRegion, yMin: rightChild.split.val, dominantClass: getDominantClass(rightChild.rightPts) });
        }
      } else { regions.push(rightRegion); }
    } else { regions.push(rightRegion); }

    return { splits, regions };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-wide uppercase text-emerald-400 flex items-center gap-3">
            Decision Trees (CART)
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
              Depth: 2
            </span>
          </h2>
          <p className="text-slate-400 text-sm">Thuật toán chia cắt dữ liệu thành các hình chữ nhật (Vùng quyết định).</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-700 text-xs text-slate-300 font-bold flex flex-col gap-1 shadow-inner">
            <span>Chuột trái: <span className="text-cyan-400">Class A (Xanh)</span></span>
            <span>Shift + Click: <span className="text-rose-400">Class B (Đỏ)</span></span>
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
          {/* Lưới */}
          <pattern id="grid-dt" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1"/>
          </pattern>
          <rect width="800" height="400" fill="url(#grid-dt)" />

          {/* Vùng Quyết Định (Regions) */}
          <g className="opacity-20">
            {treeModel.regions.map((reg, idx) => (
              <motion.rect 
                key={`reg-${idx}-${reg.xMin}-${reg.yMin}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                x={reg.xMin}
                y={reg.yMin}
                width={reg.xMax - reg.xMin}
                height={reg.yMax - reg.yMin}
                fill={reg.dominantClass === 0 ? "#22d3ee" : "#f43f5e"}
                stroke="#0A0E17"
                strokeWidth="2"
              />
            ))}
          </g>

          {/* Trục X và Y */}
          <path d="M 60 360 L 740 360" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
          <path d="M 60 360 L 60 40" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />

          {/* Đường cắt (Splits) */}
          {treeModel.splits.map((split, idx) => {
            const isRoot = split.isRoot;
            return (
              <motion.line 
                key={`split-${idx}-${split.axis}-${split.val}`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ type: "spring", stiffness: 50, damping: 15 }}
                x1={split.axis === 'x' ? split.val : 60}
                y1={split.axis === 'y' ? split.val : 40}
                x2={split.axis === 'x' ? split.val : 740}
                y2={split.axis === 'y' ? split.val : 360}
                stroke={isRoot ? "#facc15" : "#a855f7"}
                strokeWidth={isRoot ? "3" : "2"}
                strokeDasharray="6 4"
              />
            )
          })}

          {/* Dữ liệu (Points) */}
          <g strokeWidth="2">
            {points.map((p) => {
              const isClassA = p.c === 0;
              return (
                <motion.circle 
                  key={p.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  cx={p.x} 
                  cy={p.y} 
                  r="7" 
                  className={isClassA ? "fill-cyan-900 stroke-cyan-400" : "fill-rose-900 stroke-rose-400"}
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
