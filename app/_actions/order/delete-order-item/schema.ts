import { z } from "zod";

export const deleteOrderItemSchema = z.object({
  itemId: z.string(),
  companyId: z.string(),
});

export type DeleteOrderItemSchema = z.infer<typeof deleteOrderItemSchema>;
