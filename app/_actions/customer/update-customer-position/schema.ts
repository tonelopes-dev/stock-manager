import { z } from "zod";

export const updateCustomerPositionSchema = z.object({
  customerId: z.string(),
  newStageId: z.string(),
  newPosition: z.number().min(0),
});

export type UpdateCustomerPositionSchema = z.infer<typeof updateCustomerPositionSchema>;
