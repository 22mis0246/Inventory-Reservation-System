import type { ApiErrorBody, ProductDto, ReservationDto } from "@/types/api";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = "ApiClientError";
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new ApiClientError(res.status, data as ApiErrorBody);
  }
  return data as T;
}

export async function fetchProducts(): Promise<ProductDto[]> {
  const data = await parseResponse<{ products: ProductDto[] }>(
    await fetch("/api/products", { cache: "no-store" }),
  );
  return data.products;
}

export async function createReservation(input: {
  productId: string;
  warehouseId: string;
  quantity?: number;
}): Promise<ReservationDto> {
  const data = await parseResponse<{ reservation: ReservationDto }>(
    await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantity: input.quantity ?? 1,
      }),
    }),
  );
  return data.reservation;
}

export async function fetchReservation(
  id: string,
): Promise<ReservationDto> {
  const data = await parseResponse<{ reservation: ReservationDto }>(
    await fetch(`/api/reservations/${id}`, { cache: "no-store" }),
  );
  return data.reservation;
}

export async function confirmReservationApi(
  id: string,
): Promise<ReservationDto> {
  const data = await parseResponse<{ reservation: ReservationDto }>(
    await fetch(`/api/reservations/${id}/confirm`, { method: "POST" }),
  );
  return data.reservation;
}

export async function releaseReservationApi(
  id: string,
): Promise<ReservationDto | null> {
  const res = await fetch(`/api/reservations/${id}/release`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiClientError(res.status, data as ApiErrorBody);
  }
  return (data as { reservation?: ReservationDto }).reservation ?? null;
}
