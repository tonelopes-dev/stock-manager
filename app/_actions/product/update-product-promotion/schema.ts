import { z } from "zod";

export const promotionScheduleSchema = z.object({
  type: z.enum(["always", "scheduled"]),
  days: z.array(z.number()).optional(), // 0-6 (Sunday-Saturday)
  startTime: z.string().optional(), // "HH:mm"
  endTime: z.string().optional(), // "HH:mm"
});

export const updateProductPromotionSchema = z.object({
  productId: z.string(),
  promoActive: z.boolean(),
  promoPrice: z.number().nullable(),
  promoSchedule: promotionScheduleSchema.nullable(),
});

export type UpdateProductPromotionSchema = z.infer<typeof updateProductPromotionSchema>;
export type PromotionSchedule = z.infer<typeof promotionScheduleSchema>;
