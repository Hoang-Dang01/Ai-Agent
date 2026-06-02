import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import ChatPanel from '../features/ChatPanel';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <header className="mb-6 flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-600 text-white">
              <BrainCircuit size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">GitDoc</p>
              <h1 className="text-2xl font-semibold">Second Brain MVP</h1>
            </div>
          </div>
          <nav className="text-sm font-medium text-slate-600">
            <Link to="/" className="rounded-full px-4 py-2 transition hover:bg-slate-100">Dashboard</Link>
          </nav>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
          <main className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Outlet />
          </main>
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <ChatPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}
