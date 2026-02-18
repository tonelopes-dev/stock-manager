import { z } from "zod";

export const toggleProductStatusSchema = z.object({
  id: z.string().uuid(),
});

export type ToggleProductStatusSchema = z.infer<typeof toggleProductStatusSchema>;
