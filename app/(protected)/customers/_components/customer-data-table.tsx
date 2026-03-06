"use client";

import { useOptimistic } from "react";
import { DataTable } from "@/app/_components/ui/data-table";
import { customerTableColumns } from "./table-columns";
import { CustomerDto } from "@/app/_data-access/customer/get-customers";
import { EmptyState } from "@/app/_components/empty-state";
import { UsersIcon } from "lucide-react";
import { UserRole } from "@prisma/client";

interface CustomerDataTableProps {
  customers: CustomerDto[];
  userRole: UserRole;
  categories: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  checklistTemplates: any[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export const CustomerDataTable = ({
  customers: initialCustomers,
  userRole,
  categories,
  stages,
  checklistTemplates,
  pagination,
}: CustomerDataTableProps) => {
  const [optimisticCustomers, addOptimisticUpdate] = useOptimistic(
    initialCustomers,
    (
      state: CustomerDto[],
      action: { type: "DELETE"; payload: { customerId: string } },
    ) => {
      if (action.type === "DELETE") {
        return state.filter((c) => c.id !== action.payload.customerId);
      }
      return state;
    },
  );

  const handleDelete = (customerId: string) => {
    addOptimisticUpdate({ type: "DELETE", payload: { customerId } });
  };

  return (
    <DataTable
      columns={customerTableColumns}
      data={optimisticCustomers}
      pagination={pagination}
      meta={{
        categories,
        stages,
        checklistTemplates,
        userRole,
        onDelete: handleDelete,
      }}
      emptyMessage={
        <EmptyState
          icon={UsersIcon}
          title="Nenhum cliente encontrado"
          description="Você ainda não cadastrou nenhum cliente ou o filtro atual não retornou resultados."
        />
      }
    />
  );
};
