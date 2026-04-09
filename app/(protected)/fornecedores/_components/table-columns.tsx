"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Supplier } from "@prisma/client";
import SupplierTableActions from "./table-actions";

export const supplierTableColumns: ColumnDef<Supplier>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "contactName",
    header: "Contato",
  },
  {
    accessorKey: "email",
    header: "E-mail",
  },
  {
    accessorKey: "phone",
    header: "Telefone",
  },
  {
    accessorKey: "taxId",
    header: "CNPJ/CPF",
  },
  {
    id: "actions",
    cell: ({ row: { original: supplier } }) => (
      <SupplierTableActions supplier={supplier} />
    ),
  },
];
