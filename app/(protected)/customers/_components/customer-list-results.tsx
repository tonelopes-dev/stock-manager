"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CustomerDataTable } from "./customer-data-table";
import { KanbanBoard } from "./kanban/kanban-board";
import { JourneyDashboard } from "./journeys/journey-dashboard";
import { CustomerDto } from "@/app/_data-access/customer/get-customers";
import { JourneyAnalytics } from "@/app/_data-access/crm/get-crm-analytics";
import { UserRole } from "@prisma/client";
import { Dialog } from "@/app/_components/ui/dialog";
import { CustomerDetailsDialogContent } from "./details-dialog-content";

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
  journeyData: JourneyAnalytics;
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
  journeyData,
}: CustomerListResultsProps) => {
  // Unwrap the promise (triggers Suspense boundary in CustomerPageClient)
  const { data: customers, total } = use(customersPromise);
  const isTable = view === "table";

  return (
    <Suspense fallback={null}>
      <CustomerSearchHandler
        customers={customers}
        categoriesData={categoriesData}
        stagesData={stagesData}
        checklistTemplates={checklistTemplates}
      />
      {isTable ? (
        <JourneyDashboard data={journeyData} />
      ) : (
        <KanbanBoard
          initialCustomers={customers}
          stages={stagesData}
          categories={categoriesData}
          checklistTemplates={checklistTemplates}
        />
      )}
    </Suspense>
  );
};

// Internal component to handle search params and modal cleanup
const CustomerSearchHandler = ({
  customers,
  categoriesData,
  stagesData,
  checklistTemplates,
}: {
  customers: CustomerDto[];
  categoriesData: any[];
  stagesData: any[];
  checklistTemplates: any[];
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const action = searchParams.get("action");
    const idFromParam = searchParams.get("id") || searchParams.get("customerId");

    if ((action === "edit" || action === "open-modal") && idFromParam) {
      const customer = customers.find((c) => c.id === idFromParam);
      if (customer) {
        setSelectedCustomer(customer);
        setIsOpen(true);
      }
    }
  }, [searchParams, customers]);

  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Cleanup URL params without reloading the page
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      params.delete("id");
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
      setSelectedCustomer(null);
    }
  };

  if (!selectedCustomer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <CustomerDetailsDialogContent
        customer={selectedCustomer}
        categories={categoriesData}
        stages={stagesData}
        checklistTemplates={checklistTemplates}
      />
    </Dialog>
  );
};
