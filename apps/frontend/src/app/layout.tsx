import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat, Patrick_Hand, Quicksand, Nunito, Rajdhani, Chakra_Petch } from "next/font/google";
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

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const patrickHand = Patrick_Hand({
  weight: "400",
  variable: "--font-patrick",
  subsets: ["latin", "vietnamese"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin", "vietnamese"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "vietnamese"],
});

const rajdhani = Rajdhani({
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
  subsets: ["latin"],
});

const chakraPetch = Chakra_Petch({
  weight: ["400", "500", "600", "700"],
  variable: "--font-chakra",
  subsets: ["latin", "vietnamese"],
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} ${patrickHand.variable} ${quicksand.variable} ${nunito.variable} ${rajdhani.variable} ${chakraPetch.variable}`}>
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
