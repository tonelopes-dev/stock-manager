"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { List } from "react-window";
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

// Fixed Row renderer outside the component to prevent remounting on every render
const KanbanRow = memo(({ index, style, data, ...props }: any) => {
  // Try to get data from either 'data' prop (standard react-window)
  // or direct props (custom wrappers often spread rowProps)
  const customers = data?.customers || props.customers || [];
  const onCardClick = data?.onCardClick || props.onCardClick;

  const customer = customers[index];
  if (!customer) return null;

  return (
    <div style={style} className="pb-3 pr-2">
      <KanbanCard customer={customer} onClick={() => onCardClick?.(customer)} />
    </div>
  );
});

KanbanRow.displayName = "KanbanRow";

export const KanbanColumn = memo(
  ({ stage, customers, onCardClick }: KanbanColumnProps) => {
    const { setNodeRef } = useDroppable({
      id: stage.id,
      data: {
        type: "Column",
        stage,
      },
    });

    const customerIds = customers.map((c) => c.id);

    // Prepare data for the virtualized list to avoid closure issues
    const rowData = {
      customers,
      onCardClick,
    };

    return (
      <div className="flex h-[calc(100vh-180px)] w-[300px] min-w-[300px] flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
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

        <div ref={setNodeRef} className="flex flex-1 flex-col overflow-hidden">
          <SortableContext
            items={customerIds}
            strategy={verticalListSortingStrategy}
          >
            <List
              rowCount={customers.length}
              rowHeight={130}
              rowComponent={KanbanRow as any}
              rowProps={rowData}
              className="scrollbar-hide"
              style={{ height: "100%", width: "100%" }}
            />
          </SortableContext>
        </div>
      </div>
    );
  },

  (prevProps, nextProps) => {
    // Only re-render if the column's customer ids/order changed
    if (prevProps.stage.id !== nextProps.stage.id) return false;
    if (prevProps.customers.length !== nextProps.customers.length) return false;
    for (let i = 0; i < prevProps.customers.length; i++) {
      if (prevProps.customers[i].id !== nextProps.customers[i].id) return false;
    }
    return true;
  },
);

KanbanColumn.displayName = "KanbanColumn";
