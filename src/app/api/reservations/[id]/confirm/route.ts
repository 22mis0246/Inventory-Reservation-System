import { confirmReservation, releaseExpiredReservations } from "@/lib/inventory";
import { reservationIdSchema } from "@/lib/validations";
import { jsonOk, handleRouteError, reservationDto } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    await releaseExpiredReservations();
    const { id } = reservationIdSchema.parse(await params);
    const reservation = await confirmReservation(id);
    return jsonOk({ reservation: reservationDto(reservation) });
  } catch (err) {
    return handleRouteError(err);
  }
}
