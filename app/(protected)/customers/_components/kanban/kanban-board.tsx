"use client";

import {
  useState,
  useTransition,
  useEffect,
  useRef,
  useCallback,
  memo,
} from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { updateCustomerPosition } from "@/app/_actions/customer/update-customer-position";
import { toast } from "sonner";
import { Dialog } from "@/app/_components/ui/dialog";
import { CustomerDetailsDialogContent } from "../details-dialog-content";

interface KanbanBoardProps {
  initialCustomers: any[];
  stages: { id: string; name: string; order: number }[];
  categories: { id: string; name: string }[];
}

// Build a map: stageId → ordered array of customers
function buildColumnMap(
  customers: any[],
  stages: { id: string }[],
): Record<string, any[]> {
  const map: Record<string, any[]> = {};
  for (const stage of stages) {
    map[stage.id] = [];
  }
  for (const c of customers) {
    if (c.stageId && map[c.stageId]) {
      map[c.stageId].push(c);
    }
  }
  return map;
}

export const KanbanBoard = ({
  initialCustomers,
  stages,
  categories,
}: KanbanBoardProps) => {
  const [isPending, startTransition] = useTransition();
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null);

  // Column-based state: stageId → ordered array of customers
  const [columnMap, _setColumnMap] = useState(() =>
    buildColumnMap(initialCustomers, stages),
  );
  const columnMapRef = useRef(columnMap);

  const setColumnMap = useCallback(
    (
      updater:
        | Record<string, any[]>
        | ((prev: Record<string, any[]>) => Record<string, any[]>),
    ) => {
      _setColumnMap((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        columnMapRef.current = next;
        return next;
      });
    },
    [],
  );

  // Sync with server data (only when server sends new data)
  useEffect(() => {
    if (!activeCustomer && !isPending) {
      setColumnMap(buildColumnMap(initialCustomers, stages));
    }
  }, [initialCustomers, stages, setColumnMap, activeCustomer, isPending]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Find which column a customer belongs to
  const findColumn = useCallback(
    (id: string, map: Record<string, any[]>): string | null => {
      if (map[id]) return id;
      for (const [stageId, customers] of Object.entries(map)) {
        if (customers.some((c) => c.id === id)) return stageId;
      }
      return null;
    },
    [],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const col = findColumn(active.id as string, columnMapRef.current);
    if (col) {
      const customer = columnMapRef.current[col]?.find(
        (c) => c.id === active.id,
      );
      if (customer) setActiveCustomer(customer);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const currentMap = columnMapRef.current;
    const activeCol = findColumn(activeId, currentMap);
    const overCol = findColumn(overId, currentMap);

    if (!activeCol || !overCol) return;

    if (activeCol === overCol) {
      const activeItems = currentMap[activeCol];
      const activeIndex = activeItems.findIndex((c) => c.id === activeId);
      const overIndex = activeItems.findIndex((c) => c.id === overId);

      if (activeIndex === overIndex || activeIndex === -1 || overIndex === -1)
        return;

      setColumnMap((prev) => ({
        ...prev,
        [activeCol]: arrayMove(prev[activeCol], activeIndex, overIndex),
      }));
    } else {
      // Cross-column move
      setColumnMap((prev) => {
        const activeItems = [...prev[activeCol]];
        const activeIndex = activeItems.findIndex((c) => c.id === activeId);
        if (activeIndex === -1) return prev;

        const overItems = [...prev[overCol]];
        const overIsColumn = stages.some((s) => s.id === overId);
        let insertIndex: number;

        if (overIsColumn) {
          insertIndex = overItems.length;
        } else {
          const overIndex = overItems.findIndex((c) => c.id === overId);
          insertIndex = overIndex >= 0 ? overIndex : overItems.length;
        }

        const activeCust = { ...activeItems[activeIndex], stageId: overCol };
        activeItems.splice(activeIndex, 1);
        overItems.splice(insertIndex, 0, activeCust);

        return {
          ...prev,
          [activeCol]: activeItems,
          [overCol]: overItems,
        };
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCustomer(null);
    const { active, over } = event;

    if (!over) {
      setColumnMap(buildColumnMap(initialCustomers, stages));
      return;
    }

    const activeId = active.id as string;
    const currentMap = columnMapRef.current;
    const finalCol = findColumn(activeId, currentMap);

    if (!finalCol) {
      setColumnMap(buildColumnMap(initialCustomers, stages));
      return;
    }

    const colCustomers = currentMap[finalCol];
    const newPosition = colCustomers.findIndex((c) => c.id === activeId);
    const newStageId = finalCol;

    if (newPosition === -1) {
      setColumnMap(buildColumnMap(initialCustomers, stages));
      return;
    }

    startTransition(async () => {
      const result = await updateCustomerPosition({
        customerId: activeId,
        newStageId,
        newPosition,
      });

      if (result?.validationErrors || result?.serverError) {
        toast.error("Erro ao sincronizar posição com o servidor.");
        setColumnMap(buildColumnMap(initialCustomers, stages));
      }
    });
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="scrollbar-hide flex min-h-[600px] items-start gap-6 overflow-x-auto px-4 pb-6">
          {stages.map((stage) => {
            const displayItems = columnMap[stage.id] || [];
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                customers={displayItems}
                onCardClick={setViewingCustomer}
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeCustomer ? (
            <div className="rotate-3 scale-105 opacity-90 shadow-2xl">
              <KanbanCard customer={activeCustomer} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog
        open={!!viewingCustomer}
        onOpenChange={(open) => !open && setViewingCustomer(null)}
      >
        {viewingCustomer && (
          <CustomerDetailsDialogContent
            customer={viewingCustomer}
            categories={categories}
            stages={stages}
            onUpdate={(updatedCustomer) => {
              setColumnMap((prev) => {
                const newMap = { ...prev };
                // Remove from any column it might be in
                for (const stageId in newMap) {
                  newMap[stageId] = newMap[stageId].filter(
                    (c) => c.id !== updatedCustomer.id,
                  );
                }
                // Add to the correct column
                const stageId = updatedCustomer.stageId || "NONE";
                if (newMap[stageId]) {
                  newMap[stageId].push(updatedCustomer);
                }
                return newMap;
              });
              setViewingCustomer(updatedCustomer);
            }}
            onDelete={(customerId) => {
              // Optimistic delete in local map
              setColumnMap((prev) => {
                const newMap = { ...prev };
                for (const stageId in newMap) {
                  newMap[stageId] = newMap[stageId].filter(
                    (c) => c.id !== customerId,
                  );
                }
                return newMap;
              });
              setViewingCustomer(null);
            }}
          />
        )}
      </Dialog>
    </>
  );
};
