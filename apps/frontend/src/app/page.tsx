import { LiveThoughtStream } from "@/components/dashboard/live-thought-stream";
import { RAGMonitoring } from "@/components/dashboard/rag-monitoring";
import { MasterPlanWidget } from "@/components/dashboard/master-plan-widget";

export default function DashboardPage() {
  return (
    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-12 gap-6 h-full min-h-[600px]">
        <LiveThoughtStream />
        <div className="col-span-4 flex flex-col gap-6">
          <RAGMonitoring />
          <MasterPlanWidget />
        </div>
      </div>
    </div>
  );
}
