import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { releaseReservationInTx } from "./release";
import type { ReservationWithRelations } from "./types";

const reservationInclude = {
  product: {
    select: { id: true, name: true, sku: true, imageUrl: true },
  },
  warehouse: {
    select: { id: true, code: true, name: true },
  },
} as const;

/**
 * Payment succeeded: permanently decrement on-hand stock and clear the hold.
 */
export async function confirmReservation(
  reservationId: string,
): Promise<ReservationWithRelations> {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: reservationInclude,
    });

    if (!reservation) {
      throw new AppError(
        "RESERVATION_NOT_FOUND",
        "Reservation not found",
        404,
      );
    }

    if (reservation.status === "CONFIRMED") {
      return reservation;
    }

    if (reservation.status === "RELEASED") {
      throw new AppError(
        "RESERVATION_NOT_PENDING",
        "Reservation was already released",
        400,
      );
    }

    if (reservation.expiresAt.getTime() <= Date.now()) {
      await releaseReservationInTx(tx, reservation);
      throw new AppError(
        "RESERVATION_EXPIRED",
        "This hold expired — stock was returned to the shelf",
        410,
        { expiresAt: reservation.expiresAt.toISOString() },
      );
    }

    const rowsAffected = await tx.$executeRaw`
      UPDATE "Inventory"
      SET
        "totalQuantity" = "totalQuantity" - ${reservation.quantity},
        "reservedQuantity" = "reservedQuantity" - ${reservation.quantity}
      WHERE "productId" = ${reservation.productId}
        AND "warehouseId" = ${reservation.warehouseId}
        AND "reservedQuantity" >= ${reservation.quantity}
    `;

    if (Number(rowsAffected) === 0) {
      throw new AppError(
        "INSUFFICIENT_STOCK",
        "Inventory state inconsistent while confirming hold",
        500,
      );
    }

    return tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
      include: reservationInclude,
    });
  });
}
