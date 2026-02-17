import { z } from "zod";

export const produceProductSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive({ message: "A quantidade deve ser maior que zero." }),
});

export type ProduceProductSchema = z.infer<typeof produceProductSchema>;
