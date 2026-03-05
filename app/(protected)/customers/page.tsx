import { getCustomerCategories } from "../../_data-access/customer/get-customer-categories";
import { getCRMStages } from "../../_data-access/crm/get-crm-stages";
import { getCurrentUserRole } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";
import { CustomerPageClient } from "./_components/customer-page-client";
import { CustomerListResults } from "./_components/customer-list-results";

interface CustomersPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    view?: "table" | "kanban";
    page?: string;
    pageSize?: string;
  }>;
}

export const dynamic = "force-dynamic";

const CustomersPage = async ({ searchParams }: CustomersPageProps) => {
  const resolvedSearchParams = await searchParams;
  const categoryId = resolvedSearchParams?.category || "ALL";
  const view = resolvedSearchParams?.view || "table";
  const search = resolvedSearchParams?.search || "";
  const page = Number(resolvedSearchParams?.page) || 1;
  const pageSize = Number(resolvedSearchParams?.pageSize) || 10;

  const categories = await getCustomerCategories();
  const stages = await getCRMStages();
  const role = await getCurrentUserRole();

  return (
    <div className="m-8 space-y-8 overflow-auto rounded-lg bg-white p-8">
      <CustomerPageClient
        categories={categories}
        stages={stages}
        userRole={role as UserRole}
      >
        <CustomerListResults
          categoryId={categoryId}
          search={search}
          view={view}
          page={page}
          pageSize={pageSize}
        />
      </CustomerPageClient>
    </div>
  );
};

export default CustomersPage;
