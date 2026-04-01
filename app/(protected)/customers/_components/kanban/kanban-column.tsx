import { memo, useMemo, useRef, useEffect, useCallback } from "react";
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

const KanbanRow = memo(({ index, style, ...props }: any) => {
  const customers = props.customers || [];
  const onCardClick = props.onCardClick;

  const customer = customers[index];
  if (!customer) return null;

  return (
    <div style={style} className="pr-2">
      <KanbanCard customer={customer} onClick={() => onCardClick?.(customer)} />
    </div>
  );
});

KanbanRow.displayName = "KanbanRow";

export const KanbanColumn = memo(
  ({ stage, customers, onCardClick }: KanbanColumnProps) => {
    const listRef = useRef<any>(null);
    const { setNodeRef } = useDroppable({
      id: stage.id,
      data: {
        type: "Column",
        stage,
      },
    });

    const customerIds = useMemo(() => customers.map((c) => c.id), [customers]);

    const rowData = useMemo(
      () => ({
        customers,
        onCardClick,
      }),
      [customers, onCardClick],
    );

    const getRowHeight = useCallback(
      (index: number) => {
        const customer = customers[index];
        if (!customer) return 0;

        let height = 85;

        const hasNotes = !!customer.notes;
        const hasCategories =
          customer.categories && customer.categories.length > 0;
        const hasJornada =
          customer.checklists && customer.checklists.length > 0;

        if (hasNotes) height += 32;
        if (hasCategories) height += 24;
        if (hasJornada) height += 40;

        return height + 12;
      },
      [customers],
    );

    return (
      <div className="flex h-[calc(100vh-180px)] w-[300px] min-w-[300px] flex-col gap-4 rounded-xl border border-border bg-muted/50 p-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase italic tracking-tighter text-muted-foreground">
            {stage.name}
          </h3>
          <Badge
            variant="outline"
            className="border-border text-[10px] font-black text-muted-foreground"
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
              rowHeight={getRowHeight}
              rowComponent={KanbanRow as any}
              rowProps={rowData}
              className="scrollbar-premium-hover"
              style={{ height: "100%", width: "100%" }}
            />
          </SortableContext>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.stage.id !== nextProps.stage.id) return false;
    if (prevProps.customers.length !== nextProps.customers.length) return false;
    for (let i = 0; i < prevProps.customers.length; i++) {
      if (prevProps.customers[i].id !== nextProps.customers[i].id) return false;
      if (
        prevProps.customers[i].notes !== nextProps.customers[i].notes ||
        prevProps.customers[i].checklists?.length !==
          nextProps.customers[i].checklists?.length
      )
        return false;
    }
    return true;
  },
);

KanbanColumn.displayName = "KanbanColumn";
