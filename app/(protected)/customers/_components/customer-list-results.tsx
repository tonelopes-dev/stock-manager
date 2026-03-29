"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CustomerDataTable } from "./customer-data-table";
import { KanbanBoard } from "./kanban/kanban-board";
import { CustomerDto } from "@/app/_data-access/customer/get-customers";
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

  return (
    <Suspense fallback={null}>
      <CustomerSearchHandler
        customers={customers}
        categoriesData={categoriesData}
        stagesData={stagesData}
        checklistTemplates={checklistTemplates}
      />
      {isTable ? (
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
    const id = searchParams.get("id");

    if (action === "edit" && id) {
      const customer = customers.find((c) => c.id === id);
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
