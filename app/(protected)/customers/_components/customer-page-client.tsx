"use client";

import { useTransition, Suspense, TransitionStartFunction } from "react";
import Header, {
  HeaderLeft,
  HeaderRight,
  HeaderSubtitle,
  HeaderTitle,
} from "@/app/_components/header";
import { CustomerSearch } from "./customer-search";
import { CustomerCategoryFilter } from "./category-filter";
import { CustomerViewSwitcher } from "./view-switcher";
import { CRMConfigModal } from "./crm-config-modal";
import AddCustomerButton from "./create-customer-button";
import { UserRole } from "@prisma/client";
import { CustomerTableSkeleton } from "./table-skeleton";
import { cn } from "@/app/_lib/utils";

interface CustomerPageClientProps {
  categories: { id: string; name: string }[];
  stages: { id: string; name: string; order: number }[];
  userRole: UserRole;
  checklistTemplates: any[];
  children: React.ReactNode;
}

export const CustomerPageClient = ({
  categories,
  stages,
  userRole,
  checklistTemplates,
  children,
}: CustomerPageClientProps) => {
  const [isPending, startTransition] = useTransition();
  const isManagement =
    userRole === UserRole.OWNER || userRole === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      <Header>
        <HeaderLeft>
          <HeaderSubtitle>Gestão de CRM</HeaderSubtitle>
          <HeaderTitle>Clientes</HeaderTitle>
        </HeaderLeft>
        <HeaderRight>
          <div className="flex gap-3">
            <CustomerViewSwitcher startTransition={startTransition} />
            <CRMConfigModal categories={categories} stages={stages} />
            <CustomerSearch
              startTransition={startTransition}
              isPending={isPending}
            />
            <CustomerCategoryFilter
              categories={categories}
              startTransition={startTransition}
            />
            {isManagement && (
              <AddCustomerButton categories={categories} stages={stages} />
            )}
          </div>
        </HeaderRight>
      </Header>

      <div
        className={cn(
          "transition-opacity duration-300",
          isPending ? "pointer-events-none opacity-50" : "opacity-100",
        )}
      >
        <Suspense fallback={<CustomerTableSkeleton />}>{children}</Suspense>
      </div>
    </div>
  );
};
