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
}

export const CustomerDataTable = ({
  customers,
  userRole,
}: CustomerDataTableProps) => {
  return (
    <DataTable
      columns={customerTableColumns(userRole)}
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
