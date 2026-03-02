"use client";

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
}

export const CustomerDataTable = ({
  customers,
  userRole,
  categories,
  stages,
}: CustomerDataTableProps) => {
  return (
    <DataTable
      columns={customerTableColumns(userRole, categories, stages)}
      data={customers}
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
