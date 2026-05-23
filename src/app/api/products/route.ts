import { releaseExpiredReservations } from "@/lib/inventory";
import { listProductsWithStock } from "@/lib/catalog";
import { jsonOk, handleRouteError } from "@/lib/api";

export async function GET() {
  try {
    await releaseExpiredReservations();
    const products = await listProductsWithStock();
    return jsonOk({ products });
  } catch (err) {
    return handleRouteError(err);
  }
}
