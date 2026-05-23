import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { StockSnapshot } from "./types";

type DbClient = Prisma.TransactionClient | typeof prisma;

export function availableFromRow(total: number, reserved: number): number {
  return Math.max(0, total - reserved);
}

export async function getStockSnapshot(
  productId: string,
  warehouseId: string,
  db: DbClient = prisma,
): Promise<StockSnapshot | null> {
  const row = await db.inventory.findUnique({
    where: { productId_warehouseId: { productId, warehouseId } },
  });

  if (!row) return null;

  return {
    productId: row.productId,
    warehouseId: row.warehouseId,
    totalQuantity: row.totalQuantity,
    reservedQuantity: row.reservedQuantity,
    available: availableFromRow(row.totalQuantity, row.reservedQuantity),
  };
}
