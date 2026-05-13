import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { LanguageProvider } from "@/contexts/language-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Turing Hub | Vibe Agent 2026",
  description: "Advanced Personal AI Ecosystem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-[#0A0E17] text-slate-300 font-sans selection:bg-cyan-500/30">
        <LanguageProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900/40 via-[#0A0E17] to-[#0A0E17]">
              <Header />
              {children}
            </main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
