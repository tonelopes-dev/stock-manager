import { z } from "zod";

export const upsertCustomerSchema = z.object({
  id: z.string().cuid().optional().or(z.literal("")),
  name: z.string().trim().min(1, {
    message: "Obrigatório",
  }),
  email: z.string().email({ message: "E-mail inválido." }).nullable().optional().or(z.literal("")),
  phoneNumber: z.string().trim().min(1, {
    message: "Obrigatório",
  }),
  categoryIds: z.array(z.string()).min(1, {
    message: "Obrigatório",
  }),
  stageId: z.string().min(1, {
    message: "Obrigatório",
  }),
  birthDate: z.string().nullable().optional(), // ISO date string from the form
  notes: z.string().nullish().or(z.literal("")),
});

export type UpsertCustomerSchema = z.infer<typeof upsertCustomerSchema>;
