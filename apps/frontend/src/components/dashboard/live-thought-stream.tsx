"use client";

import { Activity, ShieldAlert, CheckCircle, XCircle, Info, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/language-context";
import { useSocket } from "@/contexts/socket.context";

type LogEntry = {
  id: string;
  type: 'system' | 'telemetry' | 'progress' | 'success' | 'failed' | 'hitl';
  message: string;
  timestamp: string;
};

interface HitlRequest {
  goalId: string;
  prompt: string;
  title: string;
}

export function LiveThoughtStream() {
  const { t } = useLanguage();
  const { socket, isConnected, isReconnecting } = useSocket();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeHitl, setActiveHitl] = useState<HitlRequest | null>(null);
  
  // Ref for log batching to prevent Framer Motion animation jank
  const logQueueRef = useRef<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Helper to generate a standardized log object
  const createLog = (
    message: string,
    type: LogEntry['type'] = 'system'
  ): LogEntry => ({
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    message,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
  });

  // Effect for batching updates every 250ms
  useEffect(() => {
    const flushInterval = setInterval(() => {
      if (logQueueRef.current.length > 0) {
        const queuedLogs = [...logQueueRef.current];
        logQueueRef.current = [];

        setLogs((prev) => {
          const combined = [...prev, ...queuedLogs];
          return combined.slice(-40); // Cap history at 40 entries
        });
      }
    }, 250);

    return () => clearInterval(flushInterval);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Effect for Socket.io listeners
  useEffect(() => {
    if (!socket) return;

    // Log connection boot sequence
    const systemBootLog = createLog("[System] Khởi tạo Hệ thống Turing Hub Core v2.0...", "system");
    logQueueRef.current.push(systemBootLog);

    socket.on('connect', () => {
      logQueueRef.current.push(createLog("[System] Kết nối thành công tới Cổng vận hành AI (Port 4000).", "system"));
    });

    socket.on('disconnect', (reason) => {
      logQueueRef.current.push(createLog(`[System] Mất kết nối tới Cổng vận hành: ${reason}. Chuyển sang ngoại tuyến.`, "failed"));
    });

    socket.on('reconnect', (attempt) => {
      setLogs([]); // Clear stale logs upon reconnect
      logQueueRef.current = [
        createLog(`[System] Tái lập kết nối thành công sau ${attempt} nỗ lực. Đang đồng bộ hóa...`, "system")
      ];
      setActiveHitl(null); // Reset HITL block on reconnect
    });

    socket.on('telemetry_event', (data: { event: string; message: string; payload?: any }) => {
      const logMessage = `[C# Telemetry - ${data.event}] ${data.message}`;
      logQueueRef.current.push(createLog(logMessage, "telemetry"));
    });

    socket.on('task_progress', (data: { taskId: string; status: string; error?: string; progress: number }) => {
      const logMessage = `[Orchestrator] Tác vụ ID: ${data.taskId.substring(0, 8)}... tiến trình: ${data.progress}% | Trạng thái: ${data.status}`;
      logQueueRef.current.push(createLog(logMessage, data.status === 'FAILED' ? 'failed' : 'progress'));
      
      // Auto-clear active HITL if the task state changes to completed or failed
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        setActiveHitl(null);
      }
    });

    socket.on('hitl_request', (data: HitlRequest) => {
      const logMessage = `[HITL Request] Tác nhân C# bị chặn, yêu cầu người dùng phê duyệt: "${data.prompt}"`;
      logQueueRef.current.push(createLog(logMessage, "hitl"));
      setActiveHitl(data);
    });

    socket.on('task_completed', (data: { taskId: string; result?: any }) => {
      logQueueRef.current.push(createLog(`[Worker] Tác vụ ${data.taskId.substring(0, 8)}... HOÀN THÀNH thành công.`, "success"));
      setActiveHitl(null);
    });

    socket.on('task_failed', (data: { taskId: string; error?: string }) => {
      logQueueRef.current.push(createLog(`[Worker] Tác vụ ${data.taskId.substring(0, 8)}... THẤT BẠI: ${data.error || 'Lỗi không xác định'}`, "failed"));
      setActiveHitl(null);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('reconnect');
      socket.off('telemetry_event');
      socket.off('task_progress');
      socket.off('hitl_request');
      socket.off('task_completed');
      socket.off('task_failed');
    };
  }, [socket]);

  // Handler for HITL responses
  const handleHitlSubmit = (approved: boolean) => {
    if (!socket || !activeHitl) return;
    
    console.log(`[Socket] Sending HITL answer for Goal ${activeHitl.goalId}: approved=${approved}`);
    socket.emit('hitl_response', { goalId: activeHitl.goalId, approved });
    
    logQueueRef.current.push(
      createLog(
        `[Human Input] Người dùng đã chọn ${approved ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} hành động của C# Agent.`,
        approved ? 'success' : 'failed'
      )
    );
    
    setActiveHitl(null);
  };

  const getLogStyles = (type: LogEntry['type']) => {
    switch (type) {
      case 'system':
        return 'bg-slate-800/20 border-slate-700/40 text-slate-400';
      case 'telemetry':
        return 'bg-cyan-500/5 border-cyan-500/20 text-cyan-200';
      case 'progress':
        return 'bg-blue-500/5 border-blue-500/20 text-blue-200';
      case 'success':
        return 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200';
      case 'failed':
        return 'bg-rose-500/5 border-rose-500/20 text-rose-200';
      case 'hitl':
        return 'bg-amber-500/5 border-amber-500/20 text-amber-200';
      default:
        return 'bg-slate-800/30 border-slate-700/50 text-slate-300';
    }
  };

  return (
    <div className="col-span-8 rounded-2xl border border-slate-800/60 bg-[#0F141F]/60 backdrop-blur-xl flex flex-col shadow-lg overflow-hidden relative min-h-[500px]">
      {/* Header with real-time status indicator */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900/20 z-10">
        <div className="flex items-center gap-3">
          <span className="text-cyan-500 font-mono text-lg font-bold">{`>_`}</span>
          <h2 className="text-slate-200 font-semibold tracking-wide">{t("liveThoughtStream")}</h2>
        </div>
        
        {/* Dynamic connection indicator */}
        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border ${
          isConnected 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : isReconnecting 
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
              : 'bg-slate-800/40 border-slate-700/40 text-slate-500'
        }`}>
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-widest">{t("live")}</span>
            </>
          ) : isReconnecting ? (
            <>
              <Wifi className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest animate-pulse">Reconnecting</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Offline</span>
            </>
          )}
        </div>
      </div>
      
      {/* Active Logs Container */}
      <div className="p-6 flex-1 font-mono text-xs bg-black/20 overflow-y-auto z-10 flex flex-col gap-3 custom-scrollbar relative">
        {isReconnecting && (
          <div className="sticky top-0 left-0 right-0 z-20 flex items-center justify-center gap-2 py-2 px-4 mb-2 rounded-lg border border-amber-500/20 bg-amber-500/10 backdrop-blur-md text-amber-400 font-semibold select-none shadow-md">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Kết nối bị gián đoạn. Đang kết nối lại và đồng bộ hóa...</span>
          </div>
        )}
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12 gap-2">
            <Activity className="w-8 h-8 animate-pulse text-slate-600" />
            <span>Đang chờ luồng dữ liệu tự hành từ C# Agent...</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -10, y: 5 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start gap-3 p-2.5 rounded-lg border ${getLogStyles(log.type)}`}
              >
                <span className="text-slate-500 shrink-0 select-none">
                  {log.timestamp}
                </span>
                <div className="flex gap-2 flex-1">
                  {log.type === 'success' && <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />}
                  {log.type === 'failed' && <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />}
                  {log.type === 'hitl' && <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />}
                  {log.type === 'progress' && <Activity className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />}
                  {log.type === 'system' && <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />}
                  <span 
                    className="break-all"
                    dangerouslySetInnerHTML={{ 
                      __html: log.message
                        .replace(/\[(System|RAG|Orchestrator|Worker|CV-Agent|MC-Bot|Data-Agent|C# Telemetry|Human Input|HITL Request)\]/gi, '<span class="text-cyan-400 font-semibold">[$1]</span>')
                        .replace(/(Success|Completed|Connected):/gi, '<span class="text-emerald-400 font-semibold">$1:</span>')
                        .replace(/(Failed|Disconnected|Error):/gi, '<span class="text-rose-400 font-semibold">$1:</span>')
                    }} 
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {/* HITL Gateway Interactive Alert */}
        {activeHitl && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-5 mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-md flex flex-col gap-4 shadow-[0_0_15px_rgba(245,158,11,0.1)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <ShieldAlert className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1">
                <h3 className="text-amber-400 font-bold text-sm tracking-wide">YÊU CẦU PHÊ DUYỆT (HITL GATEWAY)</h3>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  Tác nhân C# đang bị chặn tại chặng: <strong className="text-slate-100">"{activeHitl.title}"</strong>. Hãy phê duyệt để cấp quyền thực thi tiếp:
                </p>
                <div className="mt-3 p-3 rounded-lg bg-black/40 border border-amber-500/10 text-slate-200 text-xs italic">
                  "{activeHitl.prompt}"
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-amber-500/10">
              <button
                onClick={() => handleHitlSubmit(false)}
                className="px-4 py-1.5 rounded-lg border border-slate-700 bg-slate-900/40 hover:bg-slate-800 text-xs text-slate-300 transition cursor-pointer font-semibold"
              >
                Từ chối (n)
              </button>
              <button
                onClick={() => handleHitlSubmit(true)}
                className="px-4 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/15 hover:bg-amber-500/25 text-xs text-amber-400 font-semibold shadow-[0_0_10px_rgba(245,158,11,0.2)] transition cursor-pointer"
              >
                Đồng ý (y)
              </button>
            </div>
          </motion.div>
        )}

        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
