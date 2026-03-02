import { GoalType, GoalPeriod } from "@prisma/client";
import { z } from "zod";

export const upsertGoalSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, {
    message: "O nome é obrigatório.",
  }),
  description: z.string().optional(),
  type: z.nativeEnum(GoalType),
  period: z.nativeEnum(GoalPeriod),
  targetValue: z.number().positive({
    message: "O valor deve ser maior que zero.",
  }),
  productId: z.string().optional(),
  startDate: z.date({
    required_error: "A data de início é obrigatória.",
  }),
  endDate: z.date().optional(),
});

export type UpsertGoalSchema = z.infer<typeof upsertGoalSchema>;
