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
    // Profile
    adminRole: "Turing Hub Administrator",
    securityInfo: "Security Information",
    passwordAuth: "Password Authentication",
    updateBtn: "UPDATE",
    verifiedBadge: "VERIFIED",
    apiAccess: "API Access Keys",
    openaiKey: "OpenAI API Key",
    lastUsed: "Last used: 2m ago",
    revealBtn: "Reveal",
    // Shortcuts
    shortcutsDesc: "Master the cognitive interface with keyboard commands.",
    globalSearch: "Global Semantic Search",
    openCli: "Open Orchestrator CLI",
    sysPrefs: "System Preferences",
    killSwitch: "Emergency Halt (Kill Switch)",
    // Docs
    docsDesc: "System architecture specifications and operational guidelines.",
    obsManual: "Observability Manual",
    obsDesc: "How to read execution traces, system telemetry, and latency metrics.",
    ragCaps: "RAG Capabilities",
    ragDesc: "Guidelines on semantic chunking, Top-K arbitration, and Trust Tier filtering.",
    corePhysics: "Core Physics",
    coreDesc: "Universal invariants, operating modes, and epistemic boundaries.",
    agentRoles: "Agent Roles",
    agentDesc: "Responsibilities of 01-Strategy through 06-Ops within the Swarm.",
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
    // Profile
    adminRole: "Quản Trị Viên Turing Hub",
    securityInfo: "Thông Tin Bảo Mật",
    passwordAuth: "Xác Thực Mật Khẩu",
    updateBtn: "CẬP NHẬT",
    verifiedBadge: "ĐÃ XÁC THỰC",
    apiAccess: "Mã Khóa API (API Keys)",
    openaiKey: "OpenAI API Key",
    lastUsed: "Dùng lần cuối: 2 phút trước",
    revealBtn: "Hiển thị",
    // Shortcuts
    shortcutsDesc: "Làm chủ giao diện nhận thức bằng các tổ hợp phím tắt.",
    globalSearch: "Tìm Kiếm Ngữ Nghĩa Toàn Cầu",
    openCli: "Mở Terminal Điều Phối (CLI)",
    sysPrefs: "Tùy Chỉnh Hệ Thống",
    killSwitch: "Dừng Khẩn Cấp (Kill Switch)",
    // Docs
    docsDesc: "Đặc tả kiến trúc hệ thống và hướng dẫn vận hành.",
    obsManual: "Sổ Tay Quan Sát",
    obsDesc: "Cách đọc log hệ thống, thông số kỹ thuật, và độ trễ (latency).",
    ragCaps: "Kỹ Năng RAG",
    ragDesc: "Hướng dẫn chia nhỏ ngữ nghĩa, lọc Trust Tier, và Hybrid Search.",
    corePhysics: "Luật Lõi Hệ Thống",
    coreDesc: "Các định luật bất biến, chế độ vận hành, và ranh giới bảo mật.",
    agentRoles: "Vai Trò Agent",
    agentDesc: "Nhiệm vụ của các bộ phận từ 01-Strategy đến 06-Ops.",
  }
};

export type TranslationKey = keyof typeof dictionary.en;

type DictionaryContextType = {
  lang: Language;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
  vibeMode: boolean;
  toggleVibeMode: () => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  textSize: string;
  setTextSize: (size: string) => void;
  uiStyle: string;
  setUiStyle: (style: string) => void;
  themeMode: string;
  setThemeMode: (mode: string) => void;
};

const LanguageContext = createContext<DictionaryContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("vi");
  const [vibeMode, setVibeMode] = useState(true);
  const [themeColor, setThemeColorState] = useState("cyan");
  const [themeMode, setThemeModeState] = useState("dark");
  const [fontFamily, setFontFamilyState] = useState("geist-sans");
  const [textSize, setTextSizeState] = useState("normal");
  const [uiStyle, setUiStyleState] = useState("rounded");

  // Sync with document element
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme-mode", themeMode);
  }, [themeMode]);
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeColor);
  }, [themeColor]);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-font", fontFamily);
  }, [fontFamily]);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-text-size", textSize);
  }, [textSize]);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-ui-style", uiStyle);
  }, [uiStyle]);

  const setThemeColor = (color: string) => {
    setThemeColorState(color);
  };

  const setFontFamily = (font: string) => {
    setFontFamilyState(font);
  };

  const setTextSize = (size: string) => {
    setTextSizeState(size);
  };

  const setUiStyle = (style: string) => {
    setUiStyleState(style);
  };

  const setThemeMode = (mode: string) => {
    setThemeModeState(mode);
  };

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
    <LanguageContext.Provider value={{ 
      lang, toggleLang, t, vibeMode, toggleVibeMode,
      themeColor, setThemeColor, fontFamily, setFontFamily,
      textSize, setTextSize, uiStyle, setUiStyle,
      themeMode, setThemeMode
    }}>
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
