import { z } from "zod";

export const deleteCustomerCategorySchema = z.object({
  id: z.string(),
  destinationId: z.string().optional(),
});

export type DeleteCustomerCategorySchema = z.infer<typeof deleteCustomerCategorySchema>;
