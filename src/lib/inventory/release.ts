import type { Prisma, Reservation } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/db";

type DbClient = Prisma.TransactionClient;

/**
 * Return reserved units to available pool. Safe to call on already-RELEASED rows.
 */
export async function releaseReservationInTx(
  tx: DbClient,
  reservation: Reservation,
): Promise<Reservation> {
  if (reservation.status === "RELEASED") {
    return reservation;
  }

  if (reservation.status === "CONFIRMED") {
    throw new AppError(
      "RESERVATION_NOT_PENDING",
      "Cannot release a confirmed reservation",
      400,
    );
  }

  const rowsAffected = await tx.$executeRaw`
    UPDATE "Inventory"
    SET "reservedQuantity" = "reservedQuantity" - ${reservation.quantity}
    WHERE "productId" = ${reservation.productId}
      AND "warehouseId" = ${reservation.warehouseId}
      AND "reservedQuantity" >= ${reservation.quantity}
  `;

  if (Number(rowsAffected) === 0) {
    throw new AppError(
      "INSUFFICIENT_STOCK",
      "Inventory state inconsistent while releasing hold",
      500,
    );
  }

  return tx.reservation.update({
    where: { id: reservation.id },
    data: {
      status: "RELEASED",
      releasedAt: new Date(),
    },
  });
}

export async function releaseReservationById(
  reservationId: string,
): Promise<Reservation> {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new AppError(
        "RESERVATION_NOT_FOUND",
        "Reservation not found",
        404,
      );
    }

    return releaseReservationInTx(tx, reservation);
  });
}
