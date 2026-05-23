/**
 * Concurrency demo: two parallel reserves for the last unit.
 * Expect exactly one 201 and one 409.
 *
 * Usage:
 *   npx tsx scripts/race-reserve.ts
 *   BASE_URL=https://your-app.vercel.app npx tsx scripts/race-reserve.ts
 */

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

type Product = {
  id: string;
  sku: string;
  warehouses: { warehouseId: string; code: string; available: number }[];
};

async function main() {
  const productsRes = await fetch(`${BASE}/api/products`);
  if (!productsRes.ok) {
    throw new Error(`GET /api/products failed: ${productsRes.status}`);
  }

  const { products } = (await productsRes.json()) as { products: Product[] };
  const raceSku = products.find((p) => p.sku === "HD-RACE-99");
  if (!raceSku) {
    throw new Error("Seed product HD-RACE-99 not found — run npm run db:seed");
  }

  const blr = raceSku.warehouses.find((w) => w.code === "BLR");
  if (!blr || blr.available < 1) {
    throw new Error(
      "HD-RACE-99 has no stock in BLR — re-seed or release existing holds",
    );
  }

  const body = JSON.stringify({
    productId: raceSku.id,
    warehouseId: blr.warehouseId,
    quantity: 1,
  });

  console.log(`Racing 2× POST ${BASE}/api/reservations for ${raceSku.sku} @ BLR…`);

  const [a, b] = await Promise.all([
    fetch(`${BASE}/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }),
    fetch(`${BASE}/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }),
  ]);

  const statusA = a.status;
  const statusB = b.status;
  const jsonA = await a.json();
  const jsonB = await b.json();

  console.log("Request A:", statusA, jsonA.error ?? jsonA.reservation?.id);
  console.log("Request B:", statusB, jsonB.error ?? jsonB.reservation?.id);

  const statuses = [statusA, statusB].sort();
  const ok =
    statuses[0] === 201 &&
    statuses[1] === 409 &&
    jsonA.error !== jsonB.error;

  if (ok) {
    console.log("\n✓ Pass — exactly one reservation won the last unit.");
    process.exit(0);
  }

  console.error("\n✗ Unexpected outcome — expected one 201 and one 409.");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
