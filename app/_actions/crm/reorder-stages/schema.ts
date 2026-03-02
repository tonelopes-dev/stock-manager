import { z } from "zod";

export const reorderCRMStagesSchema = z.object({
  stageIds: z.array(z.string()),
});

export type ReorderCRMStagesSchema = z.infer<typeof reorderCRMStagesSchema>;
