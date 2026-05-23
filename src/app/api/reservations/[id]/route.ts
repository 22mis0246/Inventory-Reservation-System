import { releaseExpiredReservations } from "@/lib/inventory";
import { getReservationById } from "@/lib/catalog";
import { reservationIdSchema } from "@/lib/validations";
import { jsonOk, handleRouteError, reservationDto } from "@/lib/api";
import { AppError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = reservationIdSchema.parse(await params);
    await releaseExpiredReservations();
    const reservation = await getReservationById(id);

    if (!reservation) {
      throw new AppError(
        "RESERVATION_NOT_FOUND",
        "Reservation not found",
        404,
      );
    }

    return jsonOk({ reservation: reservationDto(reservation) });
  } catch (err) {
    return handleRouteError(err);
  }
}
