"use client";

import { useState, useOptimistic, useTransition } from "react";
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

  // Optimistic UI for smooth transitions
  const [optimisticCustomers, addOptimisticUpdate] = useOptimistic(
    initialCustomers,
    (state, { customerId, newStageId, newPosition }) => {
      const customerIndex = state.findIndex((c) => c.id === customerId);
      if (customerIndex === -1) return state;

      const updatedCustomer = {
        ...state[customerIndex],
        stageId: newStageId,
        position: newPosition,
      };
      const newState = [...state];
      newState.splice(customerIndex, 1);

      // Re-insert into new column at correct position
      const columnCustomers = newState
        .filter((c) => c.stageId === newStageId)
        .sort((a, b) => a.position - b.position);

      columnCustomers.splice(newPosition, 0, updatedCustomer);

      // Re-calculate positions for the affected columns
      return newState.map((c) => {
        if (c.id === customerId) return updatedCustomer;

        // Update positions in NEW column
        if (c.stageId === newStageId) {
          const idx = columnCustomers.findIndex((cc) => cc.id === c.id);
          return { ...c, position: idx };
        }

        // Update positions in OLD column
        if (c.stageId === state[customerIndex].stageId) {
          const oldColumn = state
            .filter(
              (cc) =>
                cc.stageId === state[customerIndex].stageId &&
                cc.id !== customerId,
            )
            .sort((a, b) => a.position - b.position);
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
    if (event.active.data.current?.type === "Customer") {
      setActiveCustomer(event.active.data.current.customer);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Over logic is largely handled by dnd-kit sortable
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCustomer(null);
    const { active, over } = event;

    if (!over) return;

    const customerId = active.id as string;
    const overId = over.id as string;

    const activeCustomerData = initialCustomers.find(
      (c) => c.id === customerId,
    );
    if (!activeCustomerData) return;

    let newStageId = activeCustomerData.stageId;
    let newPosition = 0;

    // 1. Determine new destination
    const isOverAColumn = stages.some((s) => s.id === overId);
    if (isOverAColumn) {
      newStageId = overId;
      const columnCustomers = optimisticCustomers.filter(
        (c) => c.stageId === newStageId,
      );
      newPosition = columnCustomers.length;
    } else {
      const overCustomer = initialCustomers.find((c) => c.id === overId);
      if (overCustomer) {
        newStageId = overCustomer.stageId;
        newPosition = overCustomer.position;
      }
    }

    // Optimization: same spot
    if (
      activeCustomerData.stageId === newStageId &&
      activeCustomerData.position === newPosition
    )
      return;

    // 2. Perform Optimistic Update
    startTransition(async () => {
      addOptimisticUpdate({ customerId, newStageId, newPosition });

      // 3. Persist to DB
      const result = await updateCustomerPosition({
        customerId,
        newStageId,
        newPosition,
      });

      if (result?.validationErrors || result?.serverError) {
        toast.error("Erro ao mover cliente. Sincronizando...");
        // router.refresh() will happen automatically on transition end if successful,
        // if not, the optimistic state is discarded by React automatically.
      }
    });
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
            const columnCustomers = optimisticCustomers
              .filter((c) => c.stageId === stage.id)
              .sort((a, b) => a.position - b.position);

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

        <DragOverlay>
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
            categories={[]} // Will be loaded inside or passed if available
            stages={stages}
          />
        )}
      </Dialog>
    </>
  );
};
