import { z } from "zod";

export const reserveBodySchema = z.object({
  productId: z.string().min(1, "productId is required"),
  warehouseId: z.string().min(1, "warehouseId is required"),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
});

export type ReserveBody = z.infer<typeof reserveBodySchema>;

export const reservationIdSchema = z.object({
  id: z.string().min(1, "reservation id is required"),
});
