import { AppError } from "@/lib/errors";

/**
 * Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
 */
export function assertCronAuthorized(request: Request): void {
  const secret = process.env.CRON_SECRET;

  if (!secret || secret === "change-me-to-a-long-random-string") {
    throw new AppError(
      "INTERNAL_ERROR",
      "CRON_SECRET is not configured",
      503,
    );
  }

  const auth = request.headers.get("authorization");
  const expected = `Bearer ${secret}`;

  if (auth !== expected) {
    throw new AppError("INTERNAL_ERROR", "Unauthorized", 401);
  }
}
