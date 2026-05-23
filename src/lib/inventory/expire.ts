import { prisma } from "@/lib/db";
import { releaseReservationInTx } from "./release";

const BATCH_SIZE = 100;

/**
 * Release all pending reservations past expiresAt.
 * Used by cron and lazy cleanup on read paths.
 */
export async function releaseExpiredReservations(): Promise<number> {
  const expired = await prisma.reservation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    take: BATCH_SIZE,
    orderBy: { expiresAt: "asc" },
  });

  if (expired.length === 0) return 0;

  let released = 0;

  for (const reservation of expired) {
    try {
      await prisma.$transaction(async (tx) => {
        const current = await tx.reservation.findUnique({
          where: { id: reservation.id },
        });
        if (!current || current.status !== "PENDING") return;
        if (current.expiresAt.getTime() > Date.now()) return;
        await releaseReservationInTx(tx, current);
      });
      released += 1;
    } catch (err) {
      console.error(`Failed to expire reservation ${reservation.id}`, err);
    }
  }

  return released;
}
