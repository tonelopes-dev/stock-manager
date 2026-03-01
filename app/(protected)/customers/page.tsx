import { getCustomers } from "../../_data-access/customer/get-customers";
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
import { UserRole, CustomerCategory } from "@prisma/client";

interface CustomersPageProps {
  searchParams: {
    category?: string;
    search?: string;
  };
}

export const dynamic = "force-dynamic";

const CustomersPage = async ({ searchParams }: CustomersPageProps) => {
  const categoryParam = searchParams?.category?.toUpperCase();
  const category = (
    ["LEAD", "REGULAR", "VIP", "INACTIVE", "ALL"].includes(categoryParam || "")
      ? categoryParam
      : "ALL"
  ) as CustomerCategory | "ALL";

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <Suspense key={category} fallback={<CustomerTableSkeleton />}>
        <CustomerTableWrapper category={category} />
      </Suspense>
    </div>
  );
};

const CustomerTableWrapper = async ({
  category,
}: {
  category: CustomerCategory | "ALL";
}) => {
  const customers = await getCustomers(category);
  const role = await getCurrentUserRole();
  const isManagement = role === UserRole.OWNER || role === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Gestão de CRM</HeaderSubtitle>
          <HeaderTitle>Clientes</HeaderTitle>
        </HeaderLeft>
        <HeaderRight>
          <div className="flex gap-3">
            <CustomerSearch />
            <CustomerCategoryFilter />
            {isManagement && <AddCustomerButton />}
          </div>
        </HeaderRight>
      </Header>

      <CustomerDataTable customers={customers} userRole={role as UserRole} />
    </div>
  );
};

export default CustomersPage;
