import { z } from "zod";

export const upsertProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "O nome é obrigatório").trim(),
  price: z
    .number({
      message: "Digite um número válido",
    })
    .min(0.01, "O valor é obrigatório"),
  stock: z
    .number({
      message: "Digite um número válido",
    })
    .positive({ message: "O estoque não pode ser zero ou negativo" })
    .min(1, "O estoque é obrigatório"),
});

export type UpsertProductSchema = z.infer<typeof upsertProductSchema>;
