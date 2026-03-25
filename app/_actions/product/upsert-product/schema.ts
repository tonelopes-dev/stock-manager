import { z } from "zod";
import { UnitType } from "@prisma/client";

export const upsertProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, {
    message: "O nome do produto é obrigatório.",
  }),
  type: z.enum(["RESELL", "PREPARED"]).default("RESELL"),
  price: z.number().min(0.01, {
    message: "O preço do produto é obrigatório.",
  }),
  cost: z.number().min(0, {
    message: "O custo do produto deve ser positivo.",
  }).default(0),
  sku: z.string().trim().nullable().optional(),
  categoryId: z.string().trim().nullable().optional(),
  environmentId: z.string().trim().nullable().optional(),
  stock: z.coerce.number().int().min(0, {
    message: "A quantidade em estoque é obrigatória.",
  }).default(0),
  unit: z.nativeEnum(UnitType).default(UnitType.UN),
  minStock: z.coerce.number().int().min(0).default(0),
  expirationDate: z.coerce.date().nullable().optional(),
  trackExpiration: z.boolean().default(false),
  imageUrl: z.string().url().optional().or(z.literal("")),
}).refine((data) => {
  // PREPARED products get their cost from the recipe, skip this validation
  if (data.type === "PREPARED") return true;
  return data.cost <= data.price;
}, {
  message: "O custo não pode ser maior que o preço de venda.",
  path: ["cost"],
});

export type UpsertProductSchema = z.infer<typeof upsertProductSchema>;