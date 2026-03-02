import { z } from "zod";

export const upsertCRMStageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "O nome é obrigatório"),
});

export type UpsertCRMStageSchema = z.infer<typeof upsertCRMStageSchema>;
