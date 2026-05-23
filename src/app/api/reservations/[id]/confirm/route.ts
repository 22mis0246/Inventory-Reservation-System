import { confirmReservation, releaseExpiredReservations } from "@/lib/inventory";
import { reservationIdSchema } from "@/lib/validations";
import { withIdempotency } from "@/lib/idempotency";
import { jsonOk, handleRouteError, reservationDto } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = reservationIdSchema.parse(await params);
  const routeKey = `POST /api/reservations/${id}/confirm`;

  return withIdempotency(request, routeKey, { reservationId: id }, async () => {
    try {
      await releaseExpiredReservations();
      const reservation = await confirmReservation(id);
      return jsonOk({ reservation: reservationDto(reservation) });
    } catch (err) {
      return handleRouteError(err);
    }
  });
}
