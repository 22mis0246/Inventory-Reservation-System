export type WarehouseStock = {
  warehouseId: string;
  code: string;
  name: string;
  totalQuantity: number;
  reservedQuantity: number;
  available: number;
};

export type ProductDto = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  imageUrl: string | null;
  warehouses: WarehouseStock[];
};

export type ReservationDto = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  confirmedAt: string | null;
  releasedAt: string | null;
  product?: { id: string; name: string; sku: string; imageUrl: string | null };
  warehouse?: { id: string; code: string; name: string };
};

export type ApiErrorBody = {
  error: string;
  message: string;
  available?: number;
  issues?: Record<string, string[]>;
};
