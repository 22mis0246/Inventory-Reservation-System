import type { Reservation, ReservationStatus } from "@prisma/client";

export type ReservationWithRelations = Reservation & {
  product: { id: string; name: string; sku: string; imageUrl: string | null };
  warehouse: { id: string; code: string; name: string };
};

export type StockSnapshot = {
  productId: string;
  warehouseId: string;
  totalQuantity: number;
  reservedQuantity: number;
  available: number;
};

export { ReservationStatus };
