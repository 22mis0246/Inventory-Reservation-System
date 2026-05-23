import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const IDEMPOTENCY_HEADER = "idempotency-key";

export function getIdempotencyKey(request: Request): string | null {
  const key = request.headers.get(IDEMPOTENCY_HEADER)?.trim();
  return key && key.length > 0 ? key : null;
}

export function hashIdempotentPayload(
  route: string,
  payload: unknown,
): string {
  const normalized = JSON.stringify({ route, payload });
  return createHash("sha256").update(normalized).digest("hex");
}

type CachedResponse = {
  statusCode: number;
  responseBody: Prisma.JsonValue;
};

async function loadCached(
  key: string,
  route: string,
): Promise<(CachedResponse & { requestHash: string }) | null> {
  return prisma.idempotencyRecord.findUnique({
    where: { key_route: { key, route } },
    select: { statusCode: true, responseBody: true, requestHash: true },
  });
}

function replayCached(cached: CachedResponse): NextResponse {
  return NextResponse.json(cached.responseBody, { status: cached.statusCode });
}

/**
 * If Idempotency-Key is present, replay stored response or run handler once.
 * Stores success and error responses (409, 410, etc.) so retries are safe.
 */
export async function withIdempotency(
  request: Request,
  route: string,
  payloadForHash: unknown,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const key = getIdempotencyKey(request);
  if (!key) {
    return handler();
  }

  const requestHash = hashIdempotentPayload(route, payloadForHash);
  const cached = await loadCached(key, route);

  if (cached) {
    if (cached.requestHash !== requestHash) {
      return NextResponse.json(
        {
          error: "IDEMPOTENCY_KEY_REUSED",
          message:
            "This Idempotency-Key was already used with a different request body",
        },
        { status: 422 },
      );
    }
    return replayCached(cached);
  }

  const response = await handler();
  const body = await response.json();
  const statusCode = response.status;

  try {
    await prisma.idempotencyRecord.create({
      data: {
        key,
        route,
        requestHash,
        statusCode,
        responseBody: body as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const raced = await loadCached(key, route);
      if (raced) {
        if (raced.requestHash !== requestHash) {
          return NextResponse.json(
            {
              error: "IDEMPOTENCY_KEY_REUSED",
              message:
                "This Idempotency-Key was already used with a different request body",
            },
            { status: 422 },
          );
        }
        return replayCached(raced);
      }
    }
    throw err;
  }

  return NextResponse.json(body, { status: statusCode });
}
