import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WAREHOUSES = [
  { code: "BLR", name: "Bengaluru Hub", region: "South" },
  { code: "DEL", name: "Delhi NCR Hub", region: "North" },
  { code: "BOM", name: "Mumbai Hub", region: "West" },
] as const;

/** Demo catalog — includes one scarce SKU (last-unit race demo). */
const PRODUCTS = [
  {
    sku: "HD-AUDIO-01",
    name: "Studio Wireless Headphones",
    description: "Noise-cancelling over-ear, 40h battery",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    stock: { BLR: 24, DEL: 18, BOM: 12 },
  },
  {
    sku: "HD-WATCH-02",
    name: "Trail Smartwatch",
    description: "GPS + heart rate, water resistant",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    stock: { BLR: 15, DEL: 9, BOM: 21 },
  },
  {
    sku: "HD-TOTE-03",
    name: "Canvas Weekender Tote",
    description: "Organic cotton, leather handles",
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
    stock: { BLR: 40, DEL: 35, BOM: 28 },
  },
  {
    sku: "HD-SHOE-04",
    name: "City Runner Sneakers",
    description: "Lightweight knit upper, size 9–11",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    stock: { BLR: 8, DEL: 14, BOM: 6 },
  },
  {
    sku: "HD-LAMP-05",
    name: "Desk Ambient Lamp",
    description: "Warm dimmable LED, USB-C",
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop",
    stock: { BLR: 30, DEL: 22, BOM: 19 },
  },
  {
    sku: "HD-RACE-99",
    name: "Limited Drop — Ceramic Mug",
    description: "Concurrency demo: only 1 unit in Bengaluru",
    imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca0d?w=400&h=400&fit=crop",
    stock: { BLR: 1, DEL: 0, BOM: 3 },
  },
] as const;

async function main() {
  console.log("Seeding Hold Desk…");

  await prisma.idempotencyRecord.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const warehouses = await Promise.all(
    WAREHOUSES.map((w) =>
      prisma.warehouse.create({
        data: { code: w.code, name: w.name, region: w.region },
      }),
    ),
  );

  const warehouseByCode = Object.fromEntries(
    warehouses.map((w) => [w.code, w]),
  ) as Record<string, (typeof warehouses)[number]>;

  for (const p of PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
      },
    });

    for (const [code, qty] of Object.entries(p.stock)) {
      const wh = warehouseByCode[code];
      if (!wh || qty === 0) continue;

      await prisma.inventory.create({
        data: {
          productId: product.id,
          warehouseId: wh.id,
          totalQuantity: qty,
          reservedQuantity: 0,
        },
      });
    }
  }

  const counts = await prisma.inventory.count();
  console.log(`Done — ${PRODUCTS.length} products, ${counts} inventory rows.`);
  console.log("Tip: reserve HD-RACE-99 from BLR twice in parallel to test 409.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
