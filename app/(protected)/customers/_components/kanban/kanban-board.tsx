"use client";

import { useState, useOptimistic, useTransition, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
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
import { updateCustomerStage } from "@/app/_actions/customer/update-customer-stage";
import { updateCustomerPosition } from "@/app/_actions/customer/update-customer-position";
import { toast } from "sonner";
import { Dialog } from "@/app/_components/ui/dialog";
import { CustomerDetailsDialogContent } from "../details-dialog-content";

interface KanbanBoardProps {
  initialCustomers: any[];
  stages: { id: string; name: string; order: number }[];
  categories: { id: string; name: string }[];
}

export const KanbanBoard = ({
  initialCustomers,
  stages,
  categories,
}: KanbanBoardProps) => {
  const [isPending, startTransition] = useTransition();
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null);

  // Local state for "live" drag reordering
  const [items, setItems] = useState(initialCustomers);

  // Sync with server data
  useEffect(() => {
    setItems(initialCustomers);
  }, [initialCustomers]);

  // Optimistic UI for smooth transitions
  const [optimisticCustomers, addOptimisticUpdate] = useOptimistic(
    initialCustomers,
    (state, action: { type: "MOVE" | "DELETE"; payload: any }) => {
      if (action.type === "DELETE") {
        return state.filter((c) => c.id !== action.payload.customerId);
      }

      const { customerId, newStageId, newPosition } = action.payload;
      const customerIndex = state.findIndex((c) => c.id === customerId);
      if (customerIndex === -1) return state;

      const activeCust = { ...state[customerIndex], stageId: newStageId };
      const others = state.filter((c) => c.id !== customerId);

      // Re-insert into target column
      const columnCustomers = others
        .filter((c) => c.stageId === newStageId)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

      columnCustomers.splice(newPosition, 0, activeCust);

      // Re-calculate positions for the affected columns
      return state.map((c) => {
        if (c.id === customerId)
          return { ...activeCust, position: newPosition };

        if (c.stageId === newStageId) {
          const idx = columnCustomers.findIndex((cc) => cc.id === c.id);
          return { ...c, position: idx };
        }

        // If moved between stages, update old column too
        if (
          state[customerIndex].stageId !== newStageId &&
          c.stageId === state[customerIndex].stageId
        ) {
          const oldColumn = others
            .filter((cc) => cc.stageId === state[customerIndex].stageId)
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
          const idx = oldColumn.findIndex((cc) => cc.id === c.id);
          return { ...c, position: idx };
        }

        return c;
      });
    },
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const customer = items.find((c) => c.id === active.id);
    if (customer) {
      setActiveCustomer(customer);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeCust = items.find((c) => c.id === activeId);
    if (!activeCust) return;

    // Find containers
    const overIsAColumn = stages.some((s) => s.id === overId);
    const overCust = items.find((c) => c.id === overId);

    const overContainerId = overIsAColumn
      ? (overId as string)
      : overCust?.stageId;
    const activeContainerId = activeCust.stageId;

    if (!overContainerId || activeContainerId === overContainerId) {
      // Same container: Dnd-kit handles this visually.
      return;
    }

    // Moving between columns
    setItems((prev) => {
      const activeIndex = prev.findIndex((i) => i.id === activeId);
      const overIndex = overIsAColumn
        ? prev.length
        : prev.findIndex((i) => i.id === overId);

      const updatedActiveCust = {
        ...prev[activeIndex],
        stageId: overContainerId,
      };
      const newItems = [...prev];
      newItems[activeIndex] = updatedActiveCust;

      return arrayMove(newItems, activeIndex, overIndex);
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCustomer(null);
    const { active, over } = event;

    if (!over) {
      setItems(initialCustomers);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeIndex = items.findIndex((i) => i.id === activeId);
    const overIndex = items.findIndex((i) => i.id === overId);

    // Final state update on drop
    const activeCust = items[activeIndex];
    const overIsAColumn = stages.some((s) => s.id === overId);
    const overCust = items.find((c) => c.id === overId);
    const overContainerId = overIsAColumn
      ? (overId as string)
      : overCust?.stageId;

    let updatedItems = items;
    if (
      activeCust &&
      overContainerId &&
      (activeCust.stageId !== overContainerId || activeId !== overId)
    ) {
      updatedItems = arrayMove(items, activeIndex, overIndex);
      if (activeCust.stageId !== overContainerId) {
        updatedItems[overIndex] = {
          ...updatedItems[overIndex],
          stageId: overContainerId,
        };
      }
      setItems(updatedItems);
    }

    const customerId = activeId;
    const finalCust = updatedItems.find((c) => c.id === customerId);
    if (!finalCust) return;

    const newStageId = finalCust.stageId;
    const columnCustomers = updatedItems.filter(
      (c) => c.stageId === newStageId,
    );
    const newPosition = columnCustomers.findIndex((c) => c.id === customerId);

    // Persist
    startTransition(async () => {
      addOptimisticUpdate({
        type: "MOVE",
        payload: { customerId, newStageId, newPosition },
      });

      const result = await updateCustomerPosition({
        customerId,
        newStageId,
        newPosition,
      });

      if (result?.validationErrors || result?.serverError) {
        toast.error("Erro ao sincronizar posição com o servidor.");
        setItems(initialCustomers);
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
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="scrollbar-hide flex min-h-[600px] items-start gap-6 overflow-x-auto px-4 pb-6">
          {stages.map((stage) => {
            const displayItems = isPending ? optimisticCustomers : items;
            const columnCustomers = displayItems.filter(
              (c) => c.stageId === stage.id,
            );

            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                customers={columnCustomers}
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
            onDelete={(customerId) => {
              addOptimisticUpdate({ type: "DELETE", payload: { customerId } });
              setViewingCustomer(null);
            }}
          />
        )}
      </Dialog>
    </>
  );
};
