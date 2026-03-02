import { getCustomers } from "../../_data-access/customer/get-customers";
import { getCustomerCategories } from "../../_data-access/customer/get-customer-categories";
import { getCRMStages } from "../../_data-access/crm/get-crm-stages";
import AddCustomerButton from "./_components/create-customer-button";
import { CustomerCategoryFilter } from "./_components/category-filter";
import { CustomerSearch } from "./_components/customer-search";
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
  }>;
}

export const dynamic = "force-dynamic";

const CustomersPage = async ({ searchParams }: CustomersPageProps) => {
  const resolvedSearchParams = await searchParams;
  const categoryId = resolvedSearchParams?.category || "ALL";

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <Suspense key={categoryId} fallback={<CustomerTableSkeleton />}>
        <CustomerTableWrapper categoryId={categoryId} />
      </Suspense>
    </div>
  );
};

const CustomerTableWrapper = async ({ categoryId }: { categoryId: string }) => {
  const customers = await getCustomers(categoryId);
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
            <CustomerSearch />
            <CustomerCategoryFilter categories={categories} />
            {isManagement && (
              <AddCustomerButton categories={categories} stages={stages} />
            )}
          </div>
        </HeaderRight>
      </Header>

      <CustomerDataTable
        customers={customers}
        userRole={role as UserRole}
        categories={categories}
        stages={stages}
      />
    </div>
  );
};

export default CustomersPage;
