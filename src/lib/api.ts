import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { toErrorResponse } from "@/lib/errors";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleRouteError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Invalid request",
        issues: err.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { status, body } = toErrorResponse(err);
  return NextResponse.json(body, { status });
}

export async function parseJsonBody<T>(
  request: Request,
  parse: (data: unknown) => T,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new Error("INVALID_JSON");
  }
  return parse(raw);
}

export function reservationDto(
  reservation: {
    id: string;
    productId: string;
    warehouseId: string;
    quantity: number;
    status: string;
    expiresAt: Date;
    createdAt: Date;
    confirmedAt: Date | null;
    releasedAt: Date | null;
    product?: { id: string; name: string; sku: string; imageUrl: string | null };
    warehouse?: { id: string; code: string; name: string };
  },
) {
  return {
    id: reservation.id,
    productId: reservation.productId,
    warehouseId: reservation.warehouseId,
    quantity: reservation.quantity,
    status: reservation.status,
    expiresAt: reservation.expiresAt.toISOString(),
    createdAt: reservation.createdAt.toISOString(),
    confirmedAt: reservation.confirmedAt?.toISOString() ?? null,
    releasedAt: reservation.releasedAt?.toISOString() ?? null,
    product: reservation.product,
    warehouse: reservation.warehouse,
  };
}
