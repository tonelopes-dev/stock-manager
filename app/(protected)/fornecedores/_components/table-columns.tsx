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
    cell: ({ row }) => {
      const raw = row.original.phone;
      if (!raw) return "—";
      const d = raw.replace(/\D/g, "");
      if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
      return raw;
    },
  },
  {
    accessorKey: "taxId",
    header: "CNPJ/CPF",
    cell: ({ row }) => {
      const raw = row.original.taxId;
      if (!raw) return "—";
      const d = raw.replace(/\D/g, "");
      if (d.length === 11)
        return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      if (d.length === 14)
        return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
      return raw;
    },
  },
  {
    id: "actions",
    cell: ({ row: { original: supplier } }) => (
      <SupplierTableActions supplier={supplier} />
    ),
  },
];
