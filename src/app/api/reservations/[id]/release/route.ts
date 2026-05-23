import { releaseReservationById } from "@/lib/inventory";
import { reservationIdSchema } from "@/lib/validations";
import { getReservationById } from "@/lib/catalog";
import { jsonOk, handleRouteError, reservationDto } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = reservationIdSchema.parse(await params);
    await releaseReservationById(id);

    const reservation = await getReservationById(id);
    if (!reservation) {
      return jsonOk({ released: true });
    }

    return jsonOk({ reservation: reservationDto(reservation) });
  } catch (err) {
    return handleRouteError(err);
  }
}
