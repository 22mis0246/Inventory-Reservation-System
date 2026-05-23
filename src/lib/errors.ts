export type AppErrorCode =
  | "INSUFFICIENT_STOCK"
  | "RESERVATION_EXPIRED"
  | "RESERVATION_NOT_FOUND"
  | "RESERVATION_NOT_PENDING"
  | "INVALID_QUANTITY"
  | "PRODUCT_NOT_FOUND"
  | "WAREHOUSE_NOT_FOUND";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function toErrorResponse(err: unknown): {
  status: number;
  body: { error: string; message: string; [key: string]: unknown };
} {
  if (isAppError(err)) {
    return {
      status: err.status,
      body: {
        error: err.code,
        message: err.message,
        ...err.details,
      },
    };
  }

  console.error(err);
  return {
    status: 500,
    body: { error: "INTERNAL_ERROR", message: "Something went wrong" },
  };
}
