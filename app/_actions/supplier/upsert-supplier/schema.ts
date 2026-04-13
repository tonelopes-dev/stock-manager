import { z } from "zod";

export const upsertSupplierSchema = z.object({
  id: z.string().cuid("ID de fornecedor inválido").optional().or(z.literal("")),
  name: z.string().min(1, "O nome da empresa ou vendedor é obrigatório"),
  contactName: z.string().optional().or(z.literal("")),
  email: z.string().email("E-mail com formato inválido").optional().or(z.literal("")),
  phone: z
    .string()
    .optional()
    .transform((val) => val?.replace(/\D/g, "")),
  taxId: z
    .string()
    .optional()
    .transform((val) => val?.replace(/\D/g, "")),
});

export type UpsertSupplierSchema = z.infer<typeof upsertSupplierSchema>;
