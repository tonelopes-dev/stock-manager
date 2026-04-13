import { z } from "zod";
import { UnitType } from "@prisma/client";

export const upsertProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, {
    message: "O nome do produto é obrigatório.",
  }),
  type: z.enum(["REVENDA", "PRODUCAO_PROPRIA", "COMBO", "INSUMO"]).default("REVENDA"),
  price: z.number().min(0, {
    message: "O preço do produto é obrigatório.",
  }).default(0),
  cost: z.number().min(0, {
    message: "O custo do produto deve ser positivo.",
  }).default(0),
  sku: z.string().trim().nullable().optional(),
  categoryId: z.string().trim().nullable().optional(),
  environmentId: z.string().trim().nullable().optional(),
  stock: z.coerce.number().min(0).default(0),
  unit: z.nativeEnum(UnitType).default(UnitType.UN),
  minStock: z.coerce.number().min(0).default(0),
  expirationDate: z.coerce.date().nullable().optional(),
  trackExpiration: z.boolean().default(false),
  imageUrl: z.string().url().optional().or(z.literal("")),
  operationalCost: z.number().min(0).default(0),
  isMadeToOrder: z.boolean().default(true),

}).refine((data) => {
  // PRODUCAO_PROPRIA and COMBO products get their cost from composition, skip validation if it's 0 here
  if (data.type === "PRODUCAO_PROPRIA" || data.type === "COMBO") return true;
  if (data.type === "INSUMO") return true; // Insumos might have price 0 as they aren't sold
  return data.cost <= data.price;
}, {
  message: "O custo não pode ser maior que o preço de venda.",
  path: ["cost"],
});

export type UpsertProductSchema = z.infer<typeof upsertProductSchema>;