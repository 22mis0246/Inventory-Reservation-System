import { reserveBodySchema } from "@/lib/validations";
import { reserveStock } from "@/lib/inventory";
import { withIdempotency } from "@/lib/idempotency";
import { jsonOk, handleRouteError, reservationDto } from "@/lib/api";
import { AppError } from "@/lib/errors";

const ROUTE_KEY = "POST /api/reservations";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return handleRouteError(
      new AppError("INVALID_QUANTITY", "Request body must be JSON", 400),
    );
  }

  const parsed = reserveBodySchema.safeParse(body);
  if (!parsed.success) {
    return handleRouteError(parsed.error);
  }

  return withIdempotency(request, ROUTE_KEY, parsed.data, async () => {
    try {
      const reservation = await reserveStock(parsed.data);
      return jsonOk({ reservation: reservationDto(reservation) }, 201);
    } catch (err) {
      return handleRouteError(err);
    }
  });
}
