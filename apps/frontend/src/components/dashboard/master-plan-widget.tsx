"use client";

import { Blocks, CheckCircle2, CircleDashed, XCircle, Circle, Eye, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useSocket } from "@/contexts/socket.context";
import { VisualPlanWidget } from "../agent/visual-plan";

interface AITask {
  id: string;
  title: string;
  status: any;
  error?: string;
}

interface UserGoal {
  id: string;
  goal: string;
  status: string;
  tasks: AITask[];
}

export function MasterPlanWidget() {
  const { t } = useLanguage();
  const { socket } = useSocket();
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Fetch the active goal and its tasks from the REST API
  const fetchActiveGoal = useCallback(async () => {
    try {
      const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const res = await fetch(`${orchestratorUrl}/api/goals/active`);
      if (!res.ok) throw new Error('Failed to fetch active goal');
      const data = await res.json();
      
      if (data.status === 'OK' && data.goal) {
        setGoal(data.goal);
      } else {
        setGoal(null);
      }
    } catch (err) {
      console.error('[MasterPlan] Error fetching active goal:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and establish a 5000ms fallback polling interval
  useEffect(() => {
    fetchActiveGoal();
    
    const intervalId = setInterval(() => {
      fetchActiveGoal();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchActiveGoal]);

  // Hook WebSockets up for push-based cache invalidation!
  // Whenever task progress, completion, or failure is broadcasted, fetch the fresh state.
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      console.log('[MasterPlan] Invalidation event received. Refetching active tasks...');
      fetchActiveGoal();
    };

    socket.on('task_progress', handleUpdate);
    socket.on('task_completed', handleUpdate);
    socket.on('task_failed', handleUpdate);
    socket.on('reconnect', handleUpdate);

    return () => {
      socket.off('task_progress', handleUpdate);
      socket.off('task_completed', handleUpdate);
      socket.off('task_failed', handleUpdate);
      socket.off('reconnect', handleUpdate);
    };
  }, [socket, fetchActiveGoal]);

  // Calculations for progress bar
  const tasks = goal?.tasks || [];
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 
    ? Math.round((completedCount / totalCount) * 100) 
    : 0;

  const isPendingApproval = goal?.status === 'PENDING_APPROVAL';

  return (
    <div className="h-48 rounded-2xl border border-slate-800/60 bg-[#0F141F]/60 backdrop-blur-xl p-5 flex flex-col shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
      
      {/* Title block */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
            <Blocks className="w-4 h-4 text-amber-500" />
          </div>
          <h2 className="text-slate-200 font-semibold tracking-wide text-xs uppercase font-mono">
            {t("masterPlan")}
          </h2>
        </div>
        <span className="text-slate-400 font-mono text-[10px] font-bold bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800">
          {completedCount}/{totalCount} Tasks
        </span>
      </div>

      {/* Goal Title */}
      <div className="text-slate-300 text-xs truncate mb-3 relative z-10 text-left font-medium select-none">
        {loading 
          ? "Đang nạp tiến trình..." 
          : goal 
            ? `Goal: ${goal.goal}` 
            : "Chưa có tiến trình hoạt động."
        }
      </div>
      
      {/* Conditionally Render Planning Banner vs Progress Bar + Task List */}
      {isPendingApproval ? (
        <div className="flex-1 flex flex-col justify-between relative z-10 text-left">
          <div className="text-[10px] text-amber-400 font-bold bg-amber-950/20 border border-amber-500/20 px-3 py-2 rounded-xl flex items-center gap-2 select-none">
            <CircleDashed className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            <span>Sơ đồ tác vụ (DAG) mới đang chờ phê duyệt tự hành...</span>
          </div>
          <button
            onClick={() => setShowPlanModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold transition cursor-pointer mt-2"
          >
            <Eye className="w-4 h-4" />
            Xem & Phê duyệt Kế hoạch
          </button>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden mb-4 relative z-10 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            />
          </div>
          
          {/* Task List */}
          <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto relative z-10 custom-scrollbar pr-1 text-left">
            {tasks.length === 0 ? (
              <div className="text-slate-500 text-[10px] italic py-2 text-center">
                Chưa có sơ đồ tác vụ nào được kích hoạt.
              </div>
            ) : (
              tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border transition ${
                    task.status === 'COMPLETED' 
                      ? 'bg-emerald-500/5 border-emerald-500/10 text-slate-300' 
                      : task.status === 'PROCESSING'
                        ? 'bg-cyan-500/5 border-cyan-500/20 text-cyan-200'
                        : task.status === 'FAILED'
                          ? 'bg-rose-500/5 border-rose-500/25 text-rose-300'
                          : 'border-transparent text-slate-500'
                  }`}
                >
                  {task.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.3)] rounded-full" />
                  ) : task.status === 'PROCESSING' ? (
                    <CircleDashed className="w-4 h-4 text-cyan-400 shrink-0 animate-spin" />
                  ) : task.status === 'FAILED' ? (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-700 shrink-0" />
                  )}
                  <span className="text-xs truncate font-medium flex-1">
                    {task.title}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Visual Plan Immersive Modal Overlay */}
      <AnimatePresence>
        {showPlanModal && goal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setShowPlanModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-5xl h-[85vh] rounded-3xl border border-slate-800 bg-[#05080f]/95 shadow-2xl overflow-hidden"
            >
              <VisualPlanWidget 
                goalId={goal.id} 
                onClose={() => setShowPlanModal(false)} 
                onPlanApproved={() => fetchActiveGoal()} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
