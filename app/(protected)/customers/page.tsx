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
  searchParams: Promise<{
    category?: string;
    search?: string;
  }>;
}

export const dynamic = "force-dynamic";

const CustomersPage = async ({ searchParams }: CustomersPageProps) => {
  const resolvedSearchParams = await searchParams;
  const categoryParam = resolvedSearchParams?.category?.toUpperCase();
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md">
          <p className="text-[10px] font-black uppercase italic tracking-tighter text-slate-400">
            Base de Clientes
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <h3 className="text-3xl font-black tracking-tighter text-slate-900">
              {customers.length}
            </h3>
            <span className="text-[10px] font-bold text-slate-500">
              Últimos 30 dias
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-emerald-50/30 p-6 shadow-sm ring-1 ring-emerald-100/50 transition-all hover:shadow-md">
          <p className="text-[10px] font-black uppercase italic tracking-tighter text-emerald-600/60">
            Clientes VIP
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <h3 className="text-3xl font-black tracking-tighter text-emerald-700">
              {customers.filter((c) => c.category === "VIP").length}
            </h3>
            <span className="text-[10px] font-bold text-emerald-600/50">
              Alto Valor
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-primary/5 p-6 shadow-sm ring-1 ring-primary/10 transition-all hover:shadow-md">
          <p className="text-[10px] font-black uppercase italic tracking-tighter text-primary/60">
            Faturamento CRM
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <h3 className="text-3xl font-black tracking-tighter text-primary">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(customers.reduce((acc, c) => acc + c.totalSpent, 0))}
            </h3>
            <span className="text-[10px] font-bold text-primary/40">
              Total Acumulado
            </span>
          </div>
        </div>
      </div>

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
