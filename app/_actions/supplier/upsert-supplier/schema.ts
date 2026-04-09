import { z } from "zod";

export const upsertSupplierSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "O nome é obrigatório"),
  contactName: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  taxId: z.string().optional(), // CNPJ/CPF
});

export type UpsertSupplierSchema = z.infer<typeof upsertSupplierSchema>;
