"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";
import { Badge } from "@/app/_components/ui/badge";

interface KanbanColumnProps {
  stage: {
    id: string;
    name: string;
  };
  customers: any[];
  onCardClick?: (customer: any) => void;
}

export const KanbanColumn = ({
  stage,
  customers,
  onCardClick,
}: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({
    id: stage.id,
    data: {
      type: "Column",
      stage,
    },
  });

  const customerIds = customers.map((c) => c.id);

  return (
    <div className="flex w-[300px] min-w-[300px] flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black uppercase italic tracking-tighter text-slate-500">
          {stage.name}
        </h3>
        <Badge
          variant="outline"
          className="border-slate-200 text-[10px] font-black text-slate-400"
        >
          {customers.length}
        </Badge>
      </div>

      <div ref={setNodeRef} className="flex min-h-[500px] flex-col gap-3">
        <SortableContext
          items={customerIds}
          strategy={verticalListSortingStrategy}
        >
          {customers.map((customer) => (
            <KanbanCard
              key={customer.id}
              customer={customer}
              onClick={() => onCardClick?.(customer)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
