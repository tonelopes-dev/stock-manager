import { z } from "zod";

export const salesReportSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
});

export type SalesReportSchema = z.infer<typeof salesReportSchema>;
