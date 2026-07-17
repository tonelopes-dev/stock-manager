"use client";

import Header, {
  HeaderLeft,
  HeaderRight,
  HeaderSubtitle,
  HeaderTitle,
} from "@/app/_components/header";
import { cn } from "@/app/_lib/utils";
import { UserRole } from "@prisma/client";
import { Suspense, useTransition } from "react";
import { CustomerCategoryFilter } from "./category-filter";
import AddCustomerButton from "./create-customer-button";
import { CRMConfigModal } from "./crm-config-modal";
import { CustomerSearch } from "./customer-search";
import { CustomerJourneyFilter } from "./journey-filter";
import { CustomerTableSkeleton } from "./table-skeleton";
import { CustomerViewSwitcher } from "./view-switcher";

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
    <div className="space-y-4">
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

      <div className="flex border-b border-border/50">
        <CustomerJourneyFilter startTransition={startTransition} />
      </div>

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
