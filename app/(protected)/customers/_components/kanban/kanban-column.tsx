"use client";

import { memo, useMemo } from "react";
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

const VirtualRow = memo(
  ({
    index,
    style,
    customers,
    onCardClick,
  }: {
    index: number;
    style: React.CSSProperties;
    customers: any[];
    onCardClick?: (customer: any) => void;
  }) => {
    const customer = customers[index];
    if (!customer) return null;
    return (
      <div style={style} className="pb-3 pr-2">
        <KanbanCard
          customer={customer}
          onClick={() => onCardClick?.(customer)}
        />
      </div>
    );
  },
);

VirtualRow.displayName = "VirtualRow";

export const KanbanColumn = memo(
  ({ stage, customers, onCardClick }: KanbanColumnProps) => {
    const { setNodeRef } = useDroppable({
      id: stage.id,
      data: {
        type: "Column",
        stage,
      },
    });

    const customerIds = useMemo(() => customers.map((c) => c.id), [customers]);

    const rowProps = useMemo(
      () => ({ customers, onCardClick }),
      [customers, onCardClick],
    );

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
              rowComponent={VirtualRow as any}
              rowProps={rowProps}
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
