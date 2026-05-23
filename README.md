# Hold Desk

Multi-warehouse **inventory holds** for checkout — reserve stock for 10 minutes while payment completes; confirm to sell or release when payment fails / timer expires.

Built for the [Allo Engineering take-home](https://github.com) (inventory reservation exercise).

## Live demo

> Deploy to Vercel and add your URL here before the debrief.

`https://YOUR_APP.vercel.app`

## Stack

| Layer | Tech |
|--------|------|
| App | Next.js 15 (App Router), TypeScript, Tailwind |
| DB | Supabase Postgres + Prisma |
| Validation | Zod |
| Client | TanStack Query |

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USER/hold-desk.git
cd hold-desk
npm install
```

### 2. Environment

Copy `.env.example` → `.env` and fill in Supabase strings from **Dashboard → Connect → ORMs → Prisma**:

```env
DATABASE_URL=...   # port 6543, ?pgbouncer=true
DIRECT_URL=...     # port 5432 (session pooler)
RESERVATION_TTL_MINUTES=10
CRON_SECRET=some-long-random-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

URL-encode special characters in passwords (`@` → `%40`).

### 3. Database

```bash
npm run db:setup
```

Runs migrations + seeds 6 products, 3 warehouses (BLR / DEL / BOM). **`HD-RACE-99`** has only **1 unit in Bengaluru** for concurrency testing.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | Products + per-warehouse `available` |
| GET | `/api/warehouses` | Warehouse list |
| POST | `/api/reservations` | Create hold — **409** if insufficient stock |
| GET | `/api/reservations/:id` | Hold details |
| POST | `/api/reservations/:id/confirm` | Confirm payment — **410** if expired |
| POST | `/api/reservations/:id/release` | Cancel hold early |

### Concurrency

Reserve uses a single atomic SQL update:

```sql
UPDATE "Inventory"
SET "reservedQuantity" = "reservedQuantity" + $qty
WHERE ... AND ("totalQuantity" - "reservedQuantity") >= $qty
```

If `rows affected = 0` → **409**. Two parallel requests for the last unit → exactly one wins.

**Prove it:**

```bash
npm run dev
# another terminal:
npm run test:race
```

### Idempotency (bonus)

Send `Idempotency-Key: <uuid>` on:

- `POST /api/reservations`
- `POST /api/reservations/:id/confirm`

Same key + same body → replays stored response (including 409/410) without duplicating side effects. Different body with same key → **422**.

Stored in Postgres `IdempotencyRecord` (durable across serverless instances).

## Reservation expiry

**Primary:** Vercel Cron every minute → `GET /api/cron/release-expired` with header `Authorization: Bearer <CRON_SECRET>`.

**Backup:** Lazy cleanup on `GET /api/products`, `GET /api/reservations/:id`, and confirm.

See [docs/EXPIRY.md](docs/EXPIRY.md).

## Deploy (Vercel + Supabase)

1. Push to GitHub.
2. Import repo in Vercel.
3. Set env vars: `DATABASE_URL`, `DIRECT_URL`, `CRON_SECRET`, `RESERVATION_TTL_MINUTES`, `NEXT_PUBLIC_APP_URL`.
4. Deploy — `postinstall` runs `prisma generate`; run `npx prisma migrate deploy` once (Vercel build command or Supabase SQL).
5. Seed production: `npm run db:seed` locally against prod `DATABASE_URL`, or use a one-off script.

Cron is configured in `vercel.json`.

## Trade-offs

| Choice | Why | With more time |
|--------|-----|----------------|
| Postgres atomic UPDATE | Correct, simple, no Redis lock required | Redis lock under extreme load |
| Idempotency in Postgres | Works on serverless; no extra service | Upstash Redis TTL cache |
| 1-min cron granularity | Good enough for 10-min holds | Sub-minute worker / `pg_cron` |
| Polling (5s / 3s) | No WebSocket infra | SSE for live shelf |
| No auth | Take-home scope | API keys + admin |

## Project structure

```
src/lib/inventory/   # reserve, confirm, release, expire
src/app/api/         # REST routes
src/components/      # shelf + hold ticket UI
prisma/              # schema, migrations, seed
scripts/race-reserve.ts
```

## License

MIT (take-home submission).
