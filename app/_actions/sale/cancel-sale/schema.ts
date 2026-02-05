import { z } from "zod";

export const cancelSaleSchema = z.object({
  id: z.string().uuid(),
});

export type CancelSaleSchema = z.infer<typeof cancelSaleSchema>;
