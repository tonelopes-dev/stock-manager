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
import { toast } from "sonner";
import { Dialog } from "@/app/_components/ui/dialog";
import { CustomerDetailsDialogContent } from "../details-dialog-content";

interface KanbanBoardProps {
  initialCustomers: any[];
  stages: { id: string; name: string; order: number }[];
}

export const KanbanBoard = ({ initialCustomers, stages }: KanbanBoardProps) => {
  const [isPending, startTransition] = useTransition();
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null);

  // Optimistic UI for smooth transitions
  const [optimisticCustomers, addOptimisticCustomer] = useOptimistic(
    initialCustomers,
    (state, { customerId, newStageId }) => {
      return state.map((c) =>
        c.id === customerId ? { ...c, stageId: newStageId } : c,
      );
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

    // Logic for jumping between columns is handled in handleDragEnd for simplicity
    // and combined with Server Action call.
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCustomer(null);
    const { active, over } = event;

    if (!over) return;

    const customerId = active.id as string;
    const overId = over.id as string;

    // Check if over a column or another card
    let newStageId = overId;
    if (over.data.current?.type === "Customer") {
      newStageId = over.data.current.customer.stageId;
    }

    const currentCustomer = initialCustomers.find((c) => c.id === customerId);
    if (!currentCustomer || currentCustomer.stageId === newStageId) return;

    // 1. Update UI Optimistically
    startTransition(async () => {
      addOptimisticCustomer({ customerId, newStageId });

      // 2. Persist to DB
      const result = await updateCustomerStage({
        customerId,
        stageId: newStageId,
      });

      if (result?.validationErrors || result?.serverError) {
        toast.error("Erro ao mover cliente.");
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
        <div className="scrollbar-hide flex min-h-[600px] items-start gap-6 overflow-x-auto pb-6">
          {stages.map((stage) => {
            const columnCustomers = optimisticCustomers.filter(
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

        <DragOverlay>
          {activeCustomer ? <KanbanCard customer={activeCustomer} /> : null}
        </DragOverlay>
      </DndContext>

      <Dialog
        open={!!viewingCustomer}
        onOpenChange={(open) => !open && setViewingCustomer(null)}
      >
        {viewingCustomer && (
          <CustomerDetailsDialogContent customer={viewingCustomer} />
        )}
      </Dialog>
    </>
  );
};
