/** Shared app config from environment variables. */

export function getReservationTtlMinutes(): number {
  const raw = process.env.RESERVATION_TTL_MINUTES ?? "10";
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 10;
  }
  return parsed;
}

export function getReservationExpiresAt(from: Date = new Date()): Date {
  const ms = getReservationTtlMinutes() * 60 * 1000;
  return new Date(from.getTime() + ms);
}
