"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, LogIn, UserPlus, AlertCircle, Sparkles, Terminal } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  const { login, signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    
    if (!email || !password) {
      setError("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải dài tối thiểu 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const res = await login(email, password);
        if (res.success) {
          router.push("/");
        } else {
          setError(res.error || "Tên tài khoản hoặc mật khẩu không chính xác.");
        }
      } else {
        const res = await signup(email, password);
        if (res.success) {
          setSuccessMsg("Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
          setIsLogin(true);
          setPassword("");
        } else {
          setError(res.error || "Không thể hoàn thành đăng ký.");
        }
      }
    } catch (err: any) {
      setError("Đã xảy ra lỗi kết nối hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02050a] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background glowing rings & laser pulses */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md border border-slate-800/80 bg-[#0A0E17]/60 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-10"
      >
        {/* Decorative dynamic badge */}
        <div className="flex justify-center mb-6">
          <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <Terminal className="w-3.5 h-3.5" />
            Security Gateway Hardened
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Vibe-Agent Platform
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            {isLogin ? "Đăng nhập hệ thống vận hành tự hành" : "Khởi tạo tài khoản quản trị cục bộ"}
          </p>
        </div>

        {/* Error and Success Indicators */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-950/20 border border-rose-900/50 text-rose-300 p-3.5 rounded-2xl text-xs mb-5 flex items-start gap-2 leading-relaxed text-left"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 p-3.5 rounded-2xl text-xs mb-5 flex items-start gap-2 leading-relaxed text-left"
            >
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {/* Email input field */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@antigravity.ai"
                className="w-full bg-[#05080f] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              Mật khẩu truy cập
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#05080f] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.05)] cursor-pointer mt-8"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                Đăng nhập trạm tự hành
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Đăng ký tài khoản mới
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          {isLogin ? "Chưa có tài khoản quản trị cục bộ?" : "Đã có tài khoản quản trị?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccessMsg("");
            }}
            className="text-emerald-400 font-semibold hover:underline bg-transparent border-none cursor-pointer focus:outline-none"
          >
            {isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
