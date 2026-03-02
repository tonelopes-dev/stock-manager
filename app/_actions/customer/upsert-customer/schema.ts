import { z } from "zod";

export const upsertCustomerSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1, {
    message: "O nome do cliente é obrigatório.",
  }),
  email: z.string().email({ message: "E-mail inválido." }).nullable().optional().or(z.literal("")),
  phone: z.string().trim().nullable().optional().or(z.literal("")),
  category: z.enum(["LEAD", "REGULAR", "VIP", "INACTIVE"]).default("LEAD"),
  birthday: z.string().nullable().optional(), // ISO date string from the form
  notes: z.string().trim().nullable().optional().or(z.literal("")),
});

export type UpsertCustomerSchema = z.infer<typeof upsertCustomerSchema>;
