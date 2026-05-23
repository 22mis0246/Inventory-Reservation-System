import { listWarehouses } from "@/lib/catalog";
import { jsonOk, handleRouteError } from "@/lib/api";

export async function GET() {
  try {
    const warehouses = await listWarehouses();
    return jsonOk({ warehouses });
  } catch (err) {
    return handleRouteError(err);
  }
}
