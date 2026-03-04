"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { formatCurrency } from "@/app/_lib/utils";

interface KanbanCardProps {
  customer: {
    id: string;
    name: string;
    totalSpent: number;
    category?: { name: string } | null;
    sales?: any[];
  };
  onClick?: () => void;
}

export const KanbanCard = memo(({ customer, onClick }: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: customer.id,
    data: {
      type: "Customer",
      customer,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[100px] rounded-lg border-2 border-dashed border-slate-300 bg-slate-100 opacity-30"
      />
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="group cursor-grab border-slate-200 transition-colors hover:border-primary active:cursor-grabbing"
    >
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start justify-between">
          <span className="line-clamp-1 text-sm font-black uppercase italic tracking-tighter text-slate-800">
            {customer.name}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {customer.category && (
            <Badge
              variant="secondary"
              className="border-none bg-slate-100 px-1 py-0 text-[10px] font-black uppercase text-slate-500"
            >
              {customer.category.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 text-[10px] font-bold uppercase text-slate-400">
          <span>Total Gasto</span>
          <span className="font-black text-slate-600">
            {formatCurrency(Number(customer.totalSpent))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

KanbanCard.displayName = "KanbanCard";
