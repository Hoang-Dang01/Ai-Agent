"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper nhẹ giải mã JWT payload cục bộ mà không cần npm package (GIL-safe/pure JS)
const parseJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';

  // Khôi phục session tự động khi load trang
  useEffect(() => {
    const storedToken = localStorage.getItem("vibe_token");
    if (storedToken) {
      const decoded = parseJwt(storedToken);
      // Kiểm tra tính hợp lệ và thời gian hết hạn (exp claim)
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setToken(storedToken);
        setUser({
          id: decoded.sub || decoded.id || '',
          email: decoded.email,
        });
      } else {
        // Xóa token rác nếu đã hết hạn
        localStorage.removeItem("vibe_token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${orchestratorUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Đăng nhập thất bại.");
      }

      const jwtToken = data.access_token;
      localStorage.setItem("vibe_token", jwtToken);
      setToken(jwtToken);
      
      const decoded = parseJwt(jwtToken);
      setUser({
        id: decoded.sub || decoded.id || '',
        email: decoded.email,
      });

      return { success: true };
    } catch (err: any) {
      console.error("[AuthContext] Login error:", err);
      return { success: false, error: err.message };
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const res = await fetch(`${orchestratorUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Đăng ký thất bại.");
      }

      return { success: true };
    } catch (err: any) {
      console.error("[AuthContext] Signup error:", err);
      return { success: false, error: err.message };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("vibe_token");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
