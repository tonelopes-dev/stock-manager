"use client";

import { JourneyAnalytics } from "@/app/_data-access/crm/get-crm-analytics";
import { JourneyKpiGrid } from "./journey-kpi-grid";
import { JourneyActivityChart } from "./activity-chart";
import { RecentActivityTable } from "./recent-activity-table";

interface JourneyDashboardProps {
  data: JourneyAnalytics;
}

export function JourneyDashboard({ data }: JourneyDashboardProps) {
  return (
    <div className="space-y-10">
      {/* 1. KPIs */}
      <JourneyKpiGrid 
        completedToday={data.completedToday}
        pendingTasks={data.pendingTasks}
        delayedTasks={data.delayedTasks}
      />

      {/* 2. Chart Section */}
      <div className="rounded-xl border border-border/80 bg-background p-6 shadow-sm">
        <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-foreground">
              Volume de Entregas
            </h3>
            <p className="text-[10px] font-black uppercase text-muted-foreground">
              Tarefas concluídas nos últimos 7 dias
            </p>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <JourneyActivityChart data={data.activitySeries} />
        </div>
      </div>

      {/* 3. Recent Activity Table */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-black uppercase italic tracking-tighter text-foreground leading-none">
            Histórico Recente
          </h3>
          <p className="text-[10px] font-black uppercase text-muted-foreground mt-1">
            Últimas tarefas concluídas e mudanças de estágio no funil
          </p>
        </div>
        <RecentActivityTable activities={data.recentActivity} />
      </div>
    </div>
  );
}
