import { getCustomers } from "../../_data-access/customer/get-customers";
import { getCustomerCategories } from "../../_data-access/customer/get-customer-categories";
import { getCRMStages } from "../../_data-access/crm/get-crm-stages";
import AddCustomerButton from "./_components/create-customer-button";
import { CustomerCategoryFilter } from "./_components/category-filter";
import { CustomerSearch } from "./_components/customer-search";
import { CRMConfigModal } from "./_components/crm-config-modal";
import { CustomerViewSwitcher } from "./_components/view-switcher";
import { KanbanBoard } from "./_components/kanban/kanban-board";
import { CustomerDataTable } from "./_components/customer-data-table";
import Header, {
  HeaderLeft,
  HeaderRight,
  HeaderSubtitle,
  HeaderTitle,
} from "../../_components/header";

import { Suspense } from "react";
import { CustomerTableSkeleton } from "./_components/table-skeleton";
import { getCurrentUserRole } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";

interface CustomersPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    view?: "table" | "kanban";
  }>;
}

export const dynamic = "force-dynamic";

const CustomersPage = async ({ searchParams }: CustomersPageProps) => {
  const resolvedSearchParams = await searchParams;
  const categoryId = resolvedSearchParams?.category || "ALL";
  const view = resolvedSearchParams?.view || "table";
  const search = resolvedSearchParams?.search || "";

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <Suspense
        key={`${categoryId}-${view}-${search}`}
        fallback={<CustomerTableSkeleton />}
      >
        <CustomerTableWrapper
          categoryId={categoryId}
          view={view}
          search={search}
        />
      </Suspense>
    </div>
  );
};

const CustomerTableWrapper = async ({
  categoryId,
  view,
  search,
}: {
  categoryId: string;
  view: string;
  search: string;
}) => {
  const customers = await getCustomers(categoryId, search);
  const role = await getCurrentUserRole();
  const isManagement = role === UserRole.OWNER || role === UserRole.ADMIN;

  const categories = await getCustomerCategories();
  const stages = await getCRMStages();

  return (
    <div className="space-y-6">
      {/* ... cells ... */}
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Gestão de CRM</HeaderSubtitle>
          <HeaderTitle>Clientes</HeaderTitle>
        </HeaderLeft>
        <HeaderRight>
          <div className="flex gap-3">
            <CustomerViewSwitcher />
            <CRMConfigModal categories={categories} stages={stages} />
            <CustomerSearch />
            <CustomerCategoryFilter categories={categories} />
            {isManagement && (
              <AddCustomerButton categories={categories} stages={stages} />
            )}
          </div>
        </HeaderRight>
      </Header>

      {view === "table" ? (
        <CustomerDataTable
          customers={customers}
          userRole={role as UserRole}
          categories={categories}
          stages={stages}
        />
      ) : (
        <KanbanBoard
          initialCustomers={customers}
          stages={stages}
          categories={categories}
        />
      )}
    </div>
  );
};

export default CustomersPage;
