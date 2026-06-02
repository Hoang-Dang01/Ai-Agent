"use client";
import { useState } from "react";
import { Brain, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

// Import các modules thuật toán
import { LinearRegressionVisualizer } from "@/components/model-lab/algorithms/linear-regression";
import { LogisticRegressionVisualizer } from "@/components/model-lab/algorithms/logistic-regression";
import { DecisionTreesVisualizer } from "@/components/model-lab/algorithms/decision-trees";
import { NeuralNetworksVisualizer } from "@/components/model-lab/algorithms/neural-networks";
import { DataFlowVisualizer } from "@/components/model-lab/algorithms/data-flow";

const ALGORITHM_REGISTRY = [
  {
    id: "linear_regression",
    title: "Linear Regression",
    subtitle: "Hồi quy tuyến tính",
    subtitleEn: "Linear Regression",
    color: "cyan",
    component: LinearRegressionVisualizer
  },
  {
    id: "logistic_regression",
    title: "Logistic Regression",
    subtitle: "Phân loại nhị phân",
    subtitleEn: "Binary Classification",
    color: "purple",
    component: LogisticRegressionVisualizer
  },
  {
    id: "decision_trees",
    title: "Decision Trees",
    subtitle: "Cây quyết định (CART)",
    subtitleEn: "Decision Trees (CART)",
    color: "emerald",
    component: DecisionTreesVisualizer
  },
  {
    id: "neural_networks",
    title: "Neural Networks",
    subtitle: "Mạng Nơ-ron đa tầng",
    subtitleEn: "Multi-layer Neural Network",
    color: "amber",
    component: NeuralNetworksVisualizer
  },
  {
    id: "data_flow",
    title: "System Data Flow",
    subtitle: "Luồng dữ liệu (Sequence)",
    subtitleEn: "Data Flow (Sequence)",
    color: "blue",
    component: DataFlowVisualizer
  }
];

export default function ModelLabPage() {
  const [activeAlgoId, setActiveAlgoId] = useState("linear_regression");
  const { lang } = useLanguage();

  // Tìm component đang active
  const activeAlgo = ALGORITHM_REGISTRY.find(a => a.id === activeAlgoId);
  const ActiveComponent = activeAlgo?.component;

  return (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6 relative">
      {/* Background Cinematic */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

      {/* Header */}
      <div className="relative z-10 mb-2">
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-cyan-400" /> {lang === "vi" ? "Không Gian Học Tập ML" : "ML Model Lab"}
        </h1>
        <p className="text-slate-400 mt-2 text-sm max-w-2xl">
          {lang === "vi" ? "Nơi chạy thuật toán thời gian thực (Real-time). Thử nghiệm toán học đằng sau AI theo từng Module." : "Run algorithms in real-time. Experiment with the mathematics behind AI, module by module."}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6 relative z-10 h-full">
        {/* Left Sidebar: Topic List */}
        <div className="col-span-3 flex flex-col gap-3">
          <h2 className="text-slate-300 font-semibold text-lg flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-purple-400" /> Các Bài Học
          </h2>

          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {ALGORITHM_REGISTRY.map((algo) => {
              const isActive = activeAlgoId === algo.id;

              return (
                <div
                  key={algo.id}
                  onClick={() => setActiveAlgoId(algo.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden group ${isActive
                      ? `bg-${algo.color}-500/10 border-${algo.color}-500/30 shadow-[0_0_15px_rgba(var(--tw-colors-${algo.color}-500),0.1)]`
                      : `bg-[#0F141F] border-slate-800 hover:border-slate-600`
                    }`}
                >
                  {isActive && <div className={`absolute left-0 top-0 w-1 h-full bg-${algo.color}-400`}></div>}
                  <h3 className={`font-bold text-md mb-1 transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                    {algo.title}
                  </h3>
                  <p className={`text-xs ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                    {lang === 'vi' ? algo.subtitle : algo.subtitleEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Content: Dynamic Component Rendering */}
        <div className="col-span-9 flex flex-col gap-6">
          {ActiveComponent ? <ActiveComponent /> : (
            <div className="text-white">Không tìm thấy Component của thuật toán này.</div>
          )}
        </div>
      </div>
    </div>
  );
}
