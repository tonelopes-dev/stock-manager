import { z } from "zod";

export const deleteCRMStageSchema = z.object({
  id: z.string(),
  destinationId: z.string().optional(),
});

export type DeleteCRMStageSchema = z.infer<typeof deleteCRMStageSchema>;
