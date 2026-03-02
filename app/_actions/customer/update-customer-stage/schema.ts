import { z } from "zod";

export const updateCustomerStageSchema = z.object({
  customerId: z.string(),
  stageId: z.string(),
});

export type UpdateCustomerStageSchema = z.infer<typeof updateCustomerStageSchema>;
