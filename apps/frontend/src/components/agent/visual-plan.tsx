"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, Trash2, Edit3, X, HelpCircle, Save, 
  Settings, Layers, Terminal, AlertTriangle 
} from "lucide-react";

interface DAGTask {
  id: string;
  title: string;
  toolName: string;
  args: Record<string, any>;
  dependencies: string[] | { id: string }[];
}

interface UserGoal {
  id: string;
  goal: string;
  status: string;
  tasks: DAGTask[];
}

interface VisualPlanProps {
  goalId: string;
  onClose: () => void;
  onPlanApproved: () => void;
}

export function VisualPlanWidget({ goalId, onClose, onPlanApproved }: VisualPlanProps) {
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [tasks, setTasks] = useState<DAGTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DAGTask | null>(null);
  const [rawArgsJson, setRawArgsJson] = useState("");
  const [jsonError, setJsonError] = useState("");

  const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';

  const fetchGoalPlan = async () => {
    try {
      const res = await fetch(`${orchestratorUrl}/api/goals/${goalId}`);
      if (!res.ok) throw new Error(`Mục tiêu ID ${goalId} không tồn tại trên hệ thống.`);
      const data = await res.json();
      if (data.status === 'OK' && data.goal) {
        setGoal(data.goal);
        
        // Chuẩn hóa danh sách task dependencies từ Database
        const normalizedTasks = data.goal.tasks.map((t: any) => ({
          ...t,
          dependencies: Array.isArray(t.dependencies) 
            ? t.dependencies.map((d: any) => typeof d === 'object' ? d.id : d)
            : []
        }));
        setTasks(normalizedTasks);
      }
    } catch (err: any) {
      console.error("[VisualPlan] Error loading plan:", err);
      alert(err.message || "Không thể tải sơ đồ tác vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalPlan();
  }, [goalId]);

  // Sắp xếp phân cấp Level của từng node nhiệm vụ theo giải thuật Topological Longest Path
  const computeLevels = (): Record<string, { level: number; index: number }> => {
    const levels: Record<string, number> = {};
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    
    const getLevel = (id: string, visiting: Set<string> = new Set()): number => {
      if (id in levels) return levels[id];
      if (visiting.has(id)) {
        console.warn(`[VisualPlan Warning] Phát hiện chu trình vòng lặp phụ thuộc tại node: ${id}. Chặn đệ quy vô hạn.`);
        return 0; // Fallback level an toàn để bẻ gãy vòng lặp đệ quy
      }
      
      const task = taskMap.get(id);
      if (!task || !task.dependencies || task.dependencies.length === 0) {
        levels[id] = 0;
        return 0;
      }
      
      visiting.add(id);
      let maxParentLevel = -1;
      for (const depId of task.dependencies as string[]) {
        maxParentLevel = Math.max(maxParentLevel, getLevel(depId, new Set(visiting)));
      }
      visiting.delete(id);
      
      const currentLevel = maxParentLevel + 1;
      levels[id] = currentLevel;
      return currentLevel;
    };

    tasks.forEach(t => getLevel(t.id));

    // Đếm số lượng phần tử trong mỗi level để phân bổ tọa độ Y
    const levelCounts: Record<number, number> = {};
    const result: Record<string, { level: number; index: number }> = {};
    
    tasks.forEach(t => {
      const lvl = levels[t.id] || 0;
      if (!(lvl in levelCounts)) {
        levelCounts[lvl] = 0;
      }
      result[t.id] = {
        level: lvl,
        index: levelCounts[lvl]
      };
      levelCounts[lvl]++;
    });

    return result;
  };

  const nodePositions = computeLevels();

  // Tính toán kích thước dynamic cho SVG Canvas dựa trên số lượng Level và Node lớn nhất
  const maxLevel = tasks.length > 0 ? Math.max(...tasks.map(t => nodePositions[t.id]?.level || 0)) : 0;
  const maxNodesInLevel = (() => {
    const counts: Record<number, number> = {};
    tasks.forEach(t => {
      const lvl = nodePositions[t.id]?.level || 0;
      counts[lvl] = (counts[lvl] || 0) + 1;
    });
    return tasks.length > 0 ? Math.max(...Object.values(counts)) : 0;
  })();

  const canvasWidth = Math.max(750, 180 + maxLevel * 220);
  const canvasHeight = Math.max(400, 100 + maxNodesInLevel * 140);


  // Xử lý Xóa Node nhiệm vụ thời gian thực
  const handleDeleteNode = (taskId: string) => {
    // 1. Loại bỏ task khỏi danh sách chính
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    
    // 2. Định cấu hình lại các dependency bị mồ côi (re-bind dependencies)
    const sanitizedTasks = updatedTasks.map(t => {
      const deps = t.dependencies as string[];
      if (deps.includes(taskId)) {
        // Lấy danh sách parent dependencies của chính task bị xóa
        const deletedTask = tasks.find(dt => dt.id === taskId);
        const deletedTaskDeps = deletedTask ? (deletedTask.dependencies as string[]) : [];
        
        return {
          ...t,
          dependencies: [
            ...deps.filter(d => d !== taskId),
            ...deletedTaskDeps
          ]
        };
      }
      return t;
    });

    setTasks(sanitizedTasks);
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  // Mở trình chỉnh sửa tham số của Task
  const handleSelectTask = (task: DAGTask) => {
    setSelectedTask(task);
    setRawArgsJson(JSON.stringify(task.args || {}, null, 2));
    setJsonError("");
  };

  // Lưu chỉnh sửa tham số
  const handleSaveTaskArgs = () => {
    if (!selectedTask) return;
    try {
      const parsedArgs = JSON.parse(rawArgsJson);
      
      const updatedTasks = tasks.map(t => {
        if (t.id === selectedTask.id) {
          return {
            ...t,
            args: parsedArgs
          };
        }
        return t;
      });

      setTasks(updatedTasks);
      setSelectedTask(null);
      setJsonError("");
    } catch (e: any) {
      setJsonError("Định dạng JSON không hợp lệ: " + e.message);
    }
  };

  // Gửi duyệt sơ đồ DAG và kích hoạt workflow
  const handleApproveWorkflow = async () => {
    if (!goal) return;
    setSaving(true);
    try {
      // 1. Đồng bộ các chỉnh sửa của người dùng lên DB trước
      // Lần lượt xóa và tạo lại các task khớp với chỉnh sửa của User
      const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      
      // Gửi duyệt trực tiếp
      const approveRes = await fetch(`${orchestratorUrl}/api/goals/${goal.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!approveRes.ok) throw new Error("Phê duyệt sơ đồ tác vụ thất bại");
      
      onPlanApproved();
      onClose();
    } catch (err) {
      console.error("[VisualPlan] Error approving plan:", err);
      alert("Lỗi khi kích hoạt workflow: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#05080f]/95 text-slate-100 p-6 font-sans relative overflow-hidden select-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.02)_0%,transparent_80%)] pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6 relative z-10">
        <div className="text-left">
          <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            Cognitive Action Planner (Goal approval)
          </span>
          <h2 className="text-slate-100 font-bold text-base mt-2 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Phê duyệt Sơ đồ Tác vụ (DAG)
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
            Goal: "{goal?.goal || "Đang nạp..."}"
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            disabled={saving || loading || tasks.length === 0}
            onClick={handleApproveWorkflow}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.1)] cursor-pointer"
          >
            <Play className="w-4 h-4" />
            {saving ? "Đang kích hoạt..." : "Duyệt & Chạy tự hành"}
          </button>
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 relative z-10">
        
        {/* Left: Custom SVG Canvas (8 cols) */}
        <div className="col-span-12 lg:col-span-8 border border-slate-800 bg-slate-950/40 rounded-2xl p-4 flex items-center justify-center relative overflow-auto custom-scrollbar min-h-[350px]">
          {loading ? (
            <div className="text-slate-500 italic text-xs">Loading DAG architecture...</div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-slate-500 italic text-xs">
              <AlertTriangle className="w-6 h-6 text-rose-500/80" />
              <span>Sơ đồ tác vụ rỗng (Goal mâu thuẫn hoặc thiếu Tool).</span>
            </div>
          ) : (
            <div 
              className="relative flex items-center justify-center transition-all duration-300"
              style={{ width: canvasWidth, height: canvasHeight }}
            >
              
              {/* SVG Link lines between nodes */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                style={{ width: canvasWidth, height: canvasHeight }}
              >
                {tasks.map(task => {
                  const pos = nodePositions[task.id];
                  if (!pos) return null;
                  
                  const x1 = 70 + pos.level * 220;
                  const y1 = 60 + pos.index * 130;
                  
                  return (task.dependencies as string[]).map(depId => {
                    const parentPos = nodePositions[depId];
                    if (!parentPos) return null;
                    
                    const x2 = 70 + parentPos.level * 220;
                    const y2 = 60 + parentPos.index * 130;
                    
                    // Vẽ cung cong Cubic Bezier bóng bẩy
                    return (
                      <g key={`${task.id}-${depId}`}>
                        <path 
                          d={`M ${x2} ${y2} C ${(x1 + x2)/2} ${y2}, ${(x1 + x2)/2} ${y1}, ${x1} ${y1}`}
                          stroke="rgba(16,185,129,0.3)"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          fill="none"
                        />
                        <circle cx={x1} cy={y1} r="3" fill="#34d399" />
                      </g>
                    );
                  });
                })}
              </svg>

              {/* Render Task nodes */}
              {tasks.map(task => {
                const pos = nodePositions[task.id];
                if (!pos) return null;
                
                const left = 70 + pos.level * 220;
                const top = 60 + pos.index * 130;
                
                return (
                  <motion.div
                    key={task.id}
                    style={{ 
                      position: 'absolute', 
                      left: left - 75, // Căn giữa hộp rộng 150px
                      top: top - 45,  // Căn giữa hộp cao 90px
                      width: 150,
                      height: 90
                    }}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col justify-between group hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300 cursor-pointer"
                    onClick={() => handleSelectTask(task)}
                  >
                    <div className="text-left min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[8px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-bold border border-slate-700/30 truncate max-w-[80px]">
                          {task.toolName}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNode(task.id);
                            }}
                            className="p-1 hover:bg-rose-950/30 rounded text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-200 truncate mt-1.5 leading-tight">
                        {task.title}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[8px] text-slate-500 font-mono">
                        Level {pos.level}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.5)]"></span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Parameter Editor (4 cols) */}
        <div className="col-span-12 lg:col-span-4 border border-slate-800 bg-[#0A0D14]/80 backdrop-blur rounded-2xl p-5 flex flex-col min-h-[300px]">
          <h3 className="text-slate-200 font-bold text-xs flex items-center gap-2 mb-4 border-b border-slate-800 pb-3 text-left uppercase font-mono">
            <Settings className="w-4 h-4 text-emerald-400" />
            Cấu hình tham số Task
          </h3>
          
          <AnimatePresence mode="wait">
            {!selectedTask ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs italic select-none"
              >
                <HelpCircle className="w-8 h-8 text-slate-700 mb-2" />
                <span>Nhấp chọn một nhiệm vụ trong sơ đồ để cấu hình tham số thô JSON.</span>
              </motion.div>
            ) : (
              <motion.div 
                key="editor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col min-h-0 text-left"
              >
                <div className="mb-3">
                  <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Tác vụ đang sửa
                  </div>
                  <div className="text-xs font-bold text-slate-200 mt-1 truncate">
                    {selectedTask.title}
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 gap-1.5 mb-4">
                  <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    Tham số Arguments (JSON)
                  </label>
                  <textarea
                    rows={8}
                    value={rawArgsJson}
                    onChange={(e) => setRawArgsJson(e.target.value)}
                    className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-slate-300 focus:outline-none focus:border-emerald-500 custom-scrollbar resize-none"
                  />
                  {jsonError && (
                    <div className="text-[10px] text-rose-400 font-bold bg-rose-950/20 border border-rose-900/50 p-2 rounded-lg leading-normal flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                      <span>{jsonError}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-slate-800/60">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="px-3 py-2 border border-slate-700 bg-slate-900/30 hover:bg-slate-800 rounded-xl text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleSaveTaskArgs}
                    className="flex items-center gap-1 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Lưu cấu hình
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
