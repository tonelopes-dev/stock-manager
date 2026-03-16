import { use } from "react";
import { CustomerDataTable } from "./customer-data-table";
import { KanbanBoard } from "./kanban/kanban-board";
import { CustomerDto } from "@/app/_data-access/customer/get-customers";
import { UserRole } from "@prisma/client";

interface CustomerListResultsProps {
  categoryId: string;
  search: string;
  view: string;
  page: number;
  pageSize: number;
  checklistTemplates: any[];
  customersPromise: Promise<{ data: CustomerDto[]; total: number }>;
  role: UserRole;
  categoriesData: any[];
  stagesData: any[];
}

export const CustomerListResults = ({
  categoryId,
  search,
  view,
  page,
  pageSize,
  checklistTemplates,
  customersPromise,
  role,
  categoriesData,
  stagesData,
}: CustomerListResultsProps) => {
  // Unwrap the promise (triggers Suspense boundary in CustomerPageClient)
  const { data: customers, total } = use(customersPromise);
  const isTable = view === "table";

  return isTable ? (
    <CustomerDataTable
      customers={customers}
      userRole={role as UserRole}
      categories={categoriesData}
      stages={stagesData}
      checklistTemplates={checklistTemplates}
      pagination={{
        total,
        page,
        pageSize,
      }}
    />
  ) : (
    <KanbanBoard
      initialCustomers={customers}
      stages={stagesData}
      categories={categoriesData}
      checklistTemplates={checklistTemplates}
    />
  );
};
