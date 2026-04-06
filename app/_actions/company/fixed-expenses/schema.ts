import { z } from "zod";

export const upsertFixedExpenseSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1, {
    message: "O nome da despesa é obrigatório.",
  }),
  value: z.number().min(0, {
    message: "O valor da despesa deve ser positivo.",
  }).default(0),
});

export type UpsertFixedExpenseSchema = z.infer<typeof upsertFixedExpenseSchema>;

export const deleteFixedExpenseSchema = z.object({
  id: z.string().min(1),
});

export type DeleteFixedExpenseSchema = z.infer<typeof deleteFixedExpenseSchema>;
