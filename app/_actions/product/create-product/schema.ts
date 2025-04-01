

import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório").trim(),
  price: z
    .number({
      invalid_type_error: "Digite um número válido",
      required_error: "O valor é obrigatório",
    })
    .min(0.01, "O valor é obrigatório"),
  stock: z.coerce
    .number({
      invalid_type_error: "Digite um número válido",
      required_error: "O estoque é obrigatório",
    })
    .positive({ message: "O estoque não pode ser zero ou negativo" })
    .min(1, "O estoque é obrigatório"),
});

export type CreateProductSchema = z.infer<typeof createProductSchema>;

