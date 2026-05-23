import { prisma } from "@/lib/db";
import { availableFromRow } from "@/lib/inventory/stock";

export async function listWarehouses() {
  return prisma.warehouse.findMany({
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      region: true,
    },
  });
}

export async function listProductsWithStock() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: {
      inventories: {
        include: {
          warehouse: {
            select: { id: true, code: true, name: true },
          },
        },
      },
    },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    description: p.description,
    imageUrl: p.imageUrl,
    warehouses: p.inventories.map((inv) => ({
      warehouseId: inv.warehouseId,
      code: inv.warehouse.code,
      name: inv.warehouse.name,
      totalQuantity: inv.totalQuantity,
      reservedQuantity: inv.reservedQuantity,
      available: availableFromRow(inv.totalQuantity, inv.reservedQuantity),
    })),
  }));
}

export async function getReservationById(id: string) {
  return prisma.reservation.findUnique({
    where: { id },
    include: {
      product: {
        select: { id: true, name: true, sku: true, imageUrl: true },
      },
      warehouse: {
        select: { id: true, code: true, name: true },
      },
    },
  });
}
