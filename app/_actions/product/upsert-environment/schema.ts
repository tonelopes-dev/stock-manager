import { z } from "zod";

export const upsertEnvironmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "O nome do ambiente é obrigatório"),
  orderIndex: z.number().int().optional().default(0),
});

export type UpsertEnvironmentSchema = z.infer<typeof upsertEnvironmentSchema>;
