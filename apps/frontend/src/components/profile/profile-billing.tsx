"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth.context";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, CreditCard, Sparkles, AlertTriangle, Loader2, ArrowUpRight, CheckCircle2 } from "lucide-react";

export function ProfileBilling() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [subData, setSubData] = useState<any>(null);
  const [error, setError] = useState("");

  const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "http://localhost:4000";

  const fetchSubscription = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${orchestratorUrl}/api/payment/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as any;
        if (data.status === "OK") {
          setSubData(data);
        }
      }
    } catch (err) {
      console.error("[ProfileBilling] Failed to load subscription:", err);
      setError("Không thể tải thông tin gói cước từ hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [token]);

  const handleUpgrade = async () => {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`${orchestratorUrl}/api/payment/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json() as any;
      if (!res.ok) {
        throw new Error(data.error || "Gặp sự cố khi khởi tạo Stripe Checkout.");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Không nhận được cổng chuyển hướng thanh toán.");
      }
    } catch (err: any) {
      console.error("[ProfileBilling] Checkout error:", err);
      setError(err.message || "Không thể kết nối tới Stripe Checkout Gateway.");
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-500 font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500 mb-2" />
        <span className="text-xs font-mono">Đang truy vấn cổng gói cước...</span>
      </div>
    );
  }

  const tier = subData?.tier || "FREE";
  const isExpired = subData?.isOfflineGraceExpired || false;
  const offlineDuration = subData?.offlineDurationDays || 0;

  return (
    <div className="space-y-6 text-left max-w-2xl font-sans select-none">
      {/* Dynamic Status Badges */}
      <AnimatePresence mode="wait">
        {isExpired && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-950/20 border border-rose-900/50 p-4 rounded-2xl flex items-start gap-3 text-rose-300 text-xs leading-relaxed"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p className="font-bold text-sm">Giao diện Ngoại tuyến bị khóa (&gt; 30 ngày)</p>
              <p className="mt-1 opacity-80">
                Hệ thống nhận diện thiết bị đã chạy ngoại tuyến liên tục {offlineDuration} ngày. 
                Vui lòng kết nối mạng Internet tạm thời để xác thực bản quyền gói cước Premium của bạn.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main License Card */}
      <div className="border border-slate-800/80 bg-[#0F141F]/80 backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              Account Membership
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
              {tier === "FREE" && "Bản Cục Bộ Miễn Phí"}
              {tier === "PREMIUM" && "Turing Hub Premium"}
              {tier === "OFFLINE_EXPIRED" && "Turing Hub Premium (Quá Hạn Ngoại Tuyến)"}
            </h2>
            <p className="text-xs text-slate-400">
              {tier === "FREE" && "Quyền vận hành cục bộ không giới hạn"}
              {tier === "PREMIUM" && "Đã kích hoạt toàn bộ tính năng cao cấp"}
              {tier === "OFFLINE_EXPIRED" && "Cần kết nối internet để mở khóa lại giao diện cao cấp"}
            </p>
          </div>

          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm ${
            tier === "FREE" ? "bg-slate-800/40 border-slate-700 text-slate-400" :
            tier === "PREMIUM" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]" :
            "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}>
            {tier === "FREE" ? "Standard" : tier === "PREMIUM" ? "Active Premium" : "Offline Grace Blocked"}
          </span>
        </div>

        {error && (
          <div className="mt-4 bg-rose-950/20 border border-rose-900/50 p-3 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Benefits lists */}
        <div className="mt-6 border-t border-slate-800/60 pt-6">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">
            Tính Năng & Quyền Lợi Bản Quyền
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Tự động hóa physical desktop 100% cục bộ</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Lưu trữ tài liệu RAG GitDoc phiên bản</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${tier !== "FREE" ? "text-emerald-500" : "text-slate-600"}`} />
              <span className={tier === "FREE" ? "text-slate-600 line-through" : ""}>Đồ thị tri thức liên kết GraphRAG 3D</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${tier !== "FREE" ? "text-emerald-500" : "text-slate-600"}`} />
              <span className={tier === "FREE" ? "text-slate-600 line-through" : ""}>Lập kế hoạch đa tác nhân Planner và SVG Canvas</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {tier === "FREE" && (
          <div className="mt-8">
            <button
              onClick={handleUpgrade}
              disabled={actionLoading}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-bold transition shadow-[0_0_15px_rgba(34,211,238,0.05)] cursor-pointer"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Đang kết nối Stripe Gateway...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Nâng Cấp Premium Qua Stripe</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Soft Policy Notice */}
      <div className="rounded-xl border border-slate-800/40 bg-slate-900/10 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-300">Cam Kết Vận Hành Cục Bộ Cốt Lõi</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Các chức năng tự động hóa FlaUI closed-loop cục bộ chạy trực tiếp trên máy vật lý của bạn được đảm bảo **không bao giờ bị khóa** dưới mọi điều kiện ngoại tuyến. 
            Turing Hub tôn trọng quyền sở hữu ứng dụng tự vận hành hoàn toàn tự do của bạn.
          </p>
        </div>
      </div>
    </div>
  );
}
