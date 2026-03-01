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
import { MoreHorizontalIcon, EditIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import DeleteCustomerDialogContent from "./delete-dialog-content";
import UpsertCustomerDialogContent from "./upsert-dialog-content";
import { CustomerDto } from "@/app/_data-access/customer/get-customers";
import { UserRole } from "@prisma/client";

interface CustomerTableDropdownMenuProps {
  customer: CustomerDto;
  userRole: UserRole;
}

const CustomerTableDropdownMenu = ({
  customer,
  userRole,
}: CustomerTableDropdownMenuProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <UpsertCustomerDialogContent
          defaultValues={{
            id: customer.id,
            name: customer.name,
            email: customer.email || "",
            phone: customer.phone || "",
            category: customer.category,
            birthday: customer.birthday
              ? customer.birthday.toISOString().split("T")[0]
              : "",
            notes: customer.notes || "",
          }}
          setDialogIsOpen={setEditDialogOpen}
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
