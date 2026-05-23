import { releaseExpiredReservations } from "@/lib/inventory";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { jsonOk, handleRouteError } from "@/lib/api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vercel Cron: release pending holds past expiresAt (every minute). */
export async function GET(request: Request) {
  try {
    assertCronAuthorized(request);
    const released = await releaseExpiredReservations();
    return jsonOk({
      ok: true,
      released,
      ranAt: new Date().toISOString(),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
