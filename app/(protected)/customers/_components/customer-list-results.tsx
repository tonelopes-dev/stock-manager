import { getCustomers } from "@/app/_data-access/customer/get-customers";
import { getCustomerCategories } from "@/app/_data-access/customer/get-customer-categories";
import { getCRMStages } from "@/app/_data-access/crm/get-crm-stages";
import { getCurrentUserRole } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";
import { CustomerDataTable } from "./customer-data-table";
import { KanbanBoard } from "./kanban/kanban-board";

interface CustomerListResultsProps {
  categoryId: string;
  search: string;
  view: string;
  page: number;
  pageSize: number;
  checklistTemplates: any[];
}

export const CustomerListResults = async ({
  categoryId,
  search,
  view,
  page,
  pageSize,
  checklistTemplates,
}: CustomerListResultsProps) => {
  // If view is kanban, we fetch a larger set (no pagination UI in Kanban usually)
  const isTable = view === "table";
  const { data: customers, total } = await getCustomers(
    categoryId,
    search,
    isTable ? page : 1,
    isTable ? pageSize : 1000,
    !isTable,
  );

  const role = await getCurrentUserRole();
  const categories = await getCustomerCategories();
  const stages = await getCRMStages();

  return isTable ? (
    <CustomerDataTable
      customers={customers}
      userRole={role as UserRole}
      categories={categories}
      stages={stages}
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
      stages={stages}
      categories={categories}
      checklistTemplates={checklistTemplates}
    />
  );
};
