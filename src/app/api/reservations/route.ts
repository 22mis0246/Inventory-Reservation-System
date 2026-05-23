import { reserveBodySchema } from "@/lib/validations";
import { reserveStock } from "@/lib/inventory";
import { jsonOk, handleRouteError, reservationDto } from "@/lib/api";
import { AppError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AppError("INVALID_QUANTITY", "Request body must be JSON", 400);
    }

    const input = reserveBodySchema.parse(body);
    const reservation = await reserveStock(input);
    return jsonOk({ reservation: reservationDto(reservation) }, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
