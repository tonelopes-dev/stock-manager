"use client";

import { AlertDialog } from "@/app/_components/ui/alert-dialog";
import { Button } from "@/app/_components/ui/button";
import { Dialog } from "@/app/_components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { MoreHorizontalIcon, EditIcon, TrashIcon, EyeIcon } from "lucide-react";
import { useState } from "react";
import DeleteCustomerDialogContent from "./delete-dialog-content";
import UpsertCustomerDialogContent from "./upsert-dialog-content";
import { CustomerDetailsDialogContent } from "./details-dialog-content";
import { CustomerDto } from "@/app/_data-access/customer/get-customers";
import { UserRole } from "@prisma/client";

interface CustomerTableDropdownMenuProps {
  customer: CustomerDto;
  userRole: UserRole;
  categories: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  checklistTemplates: any[];
  onDelete?: (customerId: string) => void;
}

const CustomerTableDropdownMenu = ({
  customer,
  userRole,
  categories,
  stages,
  checklistTemplates,
  onDelete,
}: CustomerTableDropdownMenuProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const hasHistory = customer._count.sales > 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <MoreHorizontalIcon size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="gap-1.5"
            onClick={() => setDetailsDialogOpen(true)}
          >
            <EyeIcon size={16} />
            Ver Detalhes
          </DropdownMenuItem>

          <DropdownMenuItem
            className="gap-1.5"
            onClick={() => setEditDialogOpen(true)}
          >
            <EditIcon size={16} />
            Editar
          </DropdownMenuItem>

          {userRole !== UserRole.MEMBER && !hasHistory && (
            <DropdownMenuItem
              className="gap-1.5 text-red-600 focus:bg-red-50 focus:text-red-600"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <TrashIcon size={16} />
              Deletar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <CustomerDetailsDialogContent
          customer={customer}
          categories={categories}
          stages={stages}
          checklistTemplates={checklistTemplates}
          onDelete={onDelete}
        />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <UpsertCustomerDialogContent
          defaultValues={{
            id: customer.id,
            name: customer.name,
            email: customer.email || "",
            phoneNumber: customer.phoneNumber || "",
            categoryIds: customer.categories.map((c) => c.id),
            stageId: customer.stageId || "",
            birthDate: customer.birthDate
              ? customer.birthDate.toISOString().split("T")[0]
              : "",
            notes: customer.notes || "",
          }}
          setDialogIsOpen={setEditDialogOpen}
          categories={categories}
          stages={stages}
        />
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DeleteCustomerDialogContent customerId={customer.id} />
      </AlertDialog>
    </>
  );
};

export default CustomerTableDropdownMenu;
