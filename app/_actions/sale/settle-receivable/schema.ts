import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const settleReceivableSchema = z.object({
  saleId: z.string().min(1, "O ID da venda é obrigatório."),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    required_error: "Selecione um método de pagamento.",
  }),
});

export type SettleReceivableSchema = z.infer<typeof settleReceivableSchema>;
