import "server-only";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { startOfDay, subDays, format } from "date-fns";
import { AuditEventType } from "@prisma/client";

export interface JourneyAnalytics {
  completedToday: number;
  pendingTasks: number;
  delayedTasks: number;
  activitySeries: { date: string; count: number }[];
  recentActivity: Array<{
    id: string;
    type: "TASK" | "MOVE";
    title: string;
    description: string;
    customerName: string;
    customerId: string;
    date: Date;
    actorName: string;
  }>;
}

export const getCRMAnalytics = async (): Promise<JourneyAnalytics> => {
  const companyId = await getCurrentCompanyId();
  const now = new Date();
  const todayStart = startOfDay(now);
  const sevenDaysAgo = subDays(todayStart, 6);

  const [
    completedToday,
    pendingTasks,
    delayedTasks,
    completionsSeries,
    recentChecklistCompletions,
    recentStageMoves,
  ] = await Promise.all([
    // 1. Completed today
    db.checklistItem.count({
      where: {
        companyId,
        isChecked: true,
        completedAt: { gte: todayStart },
      },
    }),
    // 2. Pending tasks
    db.checklistItem.count({
      where: {
        companyId,
        isChecked: false,
      },
    }),
    // 3. Delayed tasks
    db.checklistItem.count({
      where: {
        companyId,
        isChecked: false,
        dueDate: { lt: now, not: null },
      },
    }),
    // 4. Time series for chart (last 7 days)
    db.checklistItem.groupBy({
      by: ["completedAt"],
      where: {
        companyId,
        isChecked: true,
        completedAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
    }),
    // 5. Recent Checklist Completions
    db.checklistItem.findMany({
      where: {
        companyId,
        isChecked: true,
        completedAt: { not: null },
      },
      take: 10,
      orderBy: { completedAt: "desc" },
      include: {
        checklist: {
          include: { customer: true },
        },
      },
    }),
    // 6. Recent Stage Moves (via audit log)
    db.auditEvent.findMany({
      where: {
        companyId,
        type: AuditEventType.CUSTOMER_STAGE_UPDATED,
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Process series for chart
  const seriesMap: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const date = format(subDays(todayStart, i), "yyyy-MM-dd");
    seriesMap[date] = 0;
  }

  completionsSeries.forEach((item) => {
    if (item.completedAt) {
      const dateStr = format(item.completedAt, "yyyy-MM-dd");
      if (seriesMap[dateStr] !== undefined) {
        seriesMap[dateStr] += item._count.id;
      }
    }
  });

  const activitySeries = Object.entries(seriesMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Merge and sort activities
  const mergedActivity = [
    ...recentChecklistCompletions.map((item) => ({
      id: item.id,
      type: "TASK" as const,
      title: item.title,
      description: `Concluiu tarefa no checklist "${item.checklist.title}"`,
      customerName: item.checklist.customer.name,
      customerId: item.checklist.customerId,
      date: item.completedAt!,
      actorName: "Operador", // We don't track ACTOR in ChecklistItem yet, maybe we should?
    })),
    ...recentStageMoves.map((log: any) => ({
      id: log.id,
      type: "MOVE" as const,
      title: "Movimentação de Card",
      description: `Moveu de "${log.metadata?.fromStage}" para "${log.metadata?.toStage}"`,
      customerName: log.metadata?.customerName || "Cliente",
      customerId: log.metadata?.customerId || "",
      date: log.createdAt,
      actorName: log.actorName || "Sistema",
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 15);

  return {
    completedToday,
    pendingTasks,
    delayedTasks,
    activitySeries,
    recentActivity: mergedActivity,
  };
};
