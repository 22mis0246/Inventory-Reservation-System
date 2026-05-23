import { AppError } from "@/lib/errors";
import { getReservationExpiresAt } from "@/lib/config";
import { prisma } from "@/lib/db";
import { getStockSnapshot } from "./stock";
import type { ReservationWithRelations } from "./types";

const reservationInclude = {
  product: {
    select: { id: true, name: true, sku: true, imageUrl: true },
  },
  warehouse: {
    select: { id: true, code: true, name: true },
  },
} as const;

export type ReserveInput = {
  productId: string;
  warehouseId: string;
  quantity: number;
};

/**
 * Atomically hold stock: one UPDATE … WHERE available >= qty.
 * Two concurrent requests for the last unit → exactly one succeeds.
 */
export async function reserveStock(
  input: ReserveInput,
): Promise<ReservationWithRelations> {
  const { productId, warehouseId, quantity } = input;

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new AppError(
      "INVALID_QUANTITY",
      "Quantity must be a positive integer",
      400,
    );
  }

  const [product, warehouse] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.warehouse.findUnique({ where: { id: warehouseId } }),
  ]);

  if (!product) {
    throw new AppError("PRODUCT_NOT_FOUND", "Product not found", 404);
  }
  if (!warehouse) {
    throw new AppError("WAREHOUSE_NOT_FOUND", "Warehouse not found", 404);
  }

  const expiresAt = getReservationExpiresAt();

  return prisma.$transaction(async (tx) => {
    const rowsAffected = await tx.$executeRaw`
      UPDATE "Inventory"
      SET "reservedQuantity" = "reservedQuantity" + ${quantity}
      WHERE "productId" = ${productId}
        AND "warehouseId" = ${warehouseId}
        AND ("totalQuantity" - "reservedQuantity") >= ${quantity}
    `;

    if (Number(rowsAffected) === 0) {
      const snapshot = await getStockSnapshot(productId, warehouseId, tx);
      throw new AppError(
        "INSUFFICIENT_STOCK",
        "Not enough stock available at this warehouse",
        409,
        { available: snapshot?.available ?? 0 },
      );
    }

    const reservation = await tx.reservation.create({
      data: {
        productId,
        warehouseId,
        quantity,
        status: "PENDING",
        expiresAt,
      },
      include: reservationInclude,
    });

    return reservation;
  });
}
