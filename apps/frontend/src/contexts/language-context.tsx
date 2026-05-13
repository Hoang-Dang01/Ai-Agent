"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "vi";

const dictionary = {
  en: {
    workspace: "Workspace",
    studyHub: "Study Hub",
    modelLab: "Model Lab",
    aiEngines: "AI Engines",
    theVault: "The Vault",
    integrations: "Integrations",
    experiments: "Experiments",
    collapse: "Collapse",
    systemHealth: "System Health:",
    optimal: "Optimal",
    activeAgents: "Active Agents:",
    gpuLoad: "GPU Load:",
    liveThoughtStream: "Live Thought Stream",
    live: "Live",
    ragMonitoring: "RAG Monitoring",
    hits: "Hits",
    graph: "Graph",
    latency: "Latency",
    masterPlan: "Master Plan",
    phase1: "Phase 01: Core Setup",
    phase2: "Phase 02: AI Study Hub",
    preferences: "Preferences",
    devTools: "Developer Tools",
    logout: "Log Out",
    admin: "Admin",
    profile: "My Profile",
    shortcuts: "Keyboard Shortcuts",
    help: "Help & Docs",
  },
  vi: {
    workspace: "Không Gian Làm Việc",
    studyHub: "Khu Học Tập",
    modelLab: "Phòng Mô Hình (ML)",
    aiEngines: "Động Cơ AI",
    theVault: "Kho Trí Thức",
    integrations: "Trạm Kết Nối",
    experiments: "Khu Thử Nghiệm",
    collapse: "Thu gọn",
    systemHealth: "Trạng Thái Hệ Thống:",
    optimal: "Tuyệt Vời",
    activeAgents: "Bot Hoạt Động:",
    gpuLoad: "Tải GPU:",
    liveThoughtStream: "Luồng Suy Nghĩ (Live)",
    live: "Trực Tiếp",
    ragMonitoring: "Giám Sát RAG",
    hits: "Truy Vấn",
    graph: "Bản Đồ",
    latency: "Độ Trễ",
    masterPlan: "Lộ Trình Dự Án",
    phase1: "GĐ 01: Thiết Lập Lõi",
    phase2: "GĐ 02: Trung Tâm Học Tập",
    preferences: "Tùy Chỉnh",
    devTools: "Công Cụ Lập Trình",
    logout: "Đăng Xuất",
    admin: "Quản Trị Viên",
    profile: "Hồ Sơ Của Tôi",
    shortcuts: "Phím Tắt (Shortcuts)",
    help: "Hướng Dẫn (Docs)",
  }
};

export type TranslationKey = keyof typeof dictionary.en;

type DictionaryContextType = {
  lang: Language;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
  vibeMode: boolean;
  toggleVibeMode: () => void;
};

const LanguageContext = createContext<DictionaryContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("vi");
  const [vibeMode, setVibeMode] = useState(true);

  const toggleLang = () => {
    setLang(prev => (prev === "en" ? "vi" : "en"));
  };

  const toggleVibeMode = () => {
    setVibeMode(prev => !prev);
  };

  const t = (key: TranslationKey) => {
    return dictionary[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, vibeMode, toggleVibeMode }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
