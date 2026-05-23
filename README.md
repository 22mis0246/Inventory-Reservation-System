<div align="center">

<br/>

```
██╗  ██╗ ██████╗ ██╗     ██████╗     ██████╗ ███████╗███████╗██╗  ██╗
██║  ██║██╔═══██╗██║     ██╔══██╗    ██╔══██╗██╔════╝██╔════╝██║ ██╔╝
███████║██║   ██║██║     ██║  ██║    ██║  ██║█████╗  ███████╗█████╔╝ 
██╔══██║██║   ██║██║     ██║  ██║    ██║  ██║██╔══╝  ╚════██║██╔═██╗ 
██║  ██║╚██████╔╝███████╗██████╔╝    ██████╔╝███████╗███████║██║  ██╗
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═════╝     ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝
```

**Multi-warehouse inventory reservation system — race-condition-safe, idempotent, production-ready.**

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<br/>

</div>
                            CLICK TO VIEW - https://inventory-reservation-system-nine.vercel.app/
<img width="1901" height="941" alt="image" src="https://github.com/user-attachments/assets/2d6c4049-e633-4356-8ef3-d62fd26cb2e8" />

---

## ⚡ The Problem

Every e-commerce system eventually faces this cliff:

| Approach | Failure Mode |
|---|---|
| **Reduce stock only after payment** | Two users pay for the same last unit — one order fails post-payment |
| **Reduce stock at add-to-cart** | Abandoned carts permanently ghost your inventory |
| **No reservation layer at all** | Race conditions, overselling, customer trust erosion |

**Hold Desk solves this with a temporary reservation layer** — a battle-tested pattern used by Ticketmaster, Airbnb, and every high-traffic booking platform.

---

## 🏗️ How It Works

```
User adds to cart
       │
       ▼
┌─────────────────────────────────────────┐
│         POST /api/reservations          │
│                                         │
│  Atomic SQL:                            │
│  UPDATE Inventory                       │
│  SET reservedQty = reservedQty + n      │
│  WHERE (totalQty - reservedQty) >= n    │
│                                         │
│  ✅ Row updated  →  PENDING hold        │
│  ❌ 0 rows       →  409 Conflict        │
└─────────────────────────────────────────┘
       │
       ▼
  Timer starts (TTL = 10 min)
       │
       ├──── Payment succeeds ──▶  CONFIRMED (stock permanently sold)
       │
       ├──── User cancels     ──▶  RELEASED  (stock freed immediately)
       │
       └──── Timer expires    ──▶  RELEASED  (lazy cleanup on next request)
```

The **single atomic `UPDATE` with a row-count check** is the core of the entire concurrency safety guarantee — no Redis locks, no application-level mutexes, no distributed coordination overhead.

---

## ✨ Features

- 🏭 **Multi-warehouse inventory management** — per-warehouse stock lanes with live visibility
- 🔒 **Race-condition-safe reservations** — atomic SQL guarantees exactly-once reservation
- ♻️ **Full reservation lifecycle** — `PENDING → CONFIRMED / RELEASED`
- ⏱️ **Automatic expiry with lazy cleanup** — expired holds release on next user activity
- 🔁 **Idempotency support** — safe retries via `Idempotency-Key` header
- 📉 **Scarcity indicators** — low-stock badges surface urgency in real time
- 🔔 **Conflict toasts** — immediate feedback on 409 collisions
- ⏳ **Countdown timers** — visible reservation expiry on the frontend
- 🔄 **Live inventory polling** — frontend refreshes every 5 seconds

---

## 🧱 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 15 App Router + TypeScript | Full-stack, edge-ready, type-safe |
| **Styling** | Tailwind CSS | Utility-first, zero runtime overhead |
| **Database** | Supabase PostgreSQL | Managed Postgres with row-level transactions |
| **ORM** | Prisma | Type-safe schema, migration-first workflow |
| **Validation** | Zod | Runtime schema validation on all API inputs |
| **Client State** | TanStack Query | Polling, cache invalidation, request deduplication |
| **Hosting** | Vercel | Zero-config deploys, edge network |

---

## 🔌 API Reference

### `GET /api/products`
Returns all products with per-warehouse available quantities. Also triggers lazy expiry cleanup.

### `GET /api/warehouses`
Returns list of all warehouses.

### `POST /api/reservations`
Creates a temporary inventory hold.

**Headers:**
```
Idempotency-Key: <uuid>   // optional — enables safe retries
```

**Body:**
```json
{
  "productId": "string",
  "warehouseId": "string",
  "quantity": 1
}
```

**Responses:**
- `201 Created` — reservation created, returns `reservationId` + `expiresAt`
- `409 Conflict` — insufficient stock available
- `422 Unprocessable` — validation error

---

### `GET /api/reservations/:id`
Returns reservation status + triggers lazy cleanup on expired holds.

---

### `POST /api/reservations/:id/confirm`
Confirms a `PENDING` reservation after successful payment.

**Headers:**
```
Idempotency-Key: <uuid>   // recommended for payment flows
```

**Responses:**
- `200 OK` — reservation confirmed, inventory permanently decremented
- `404 Not Found` — reservation does not exist
- `409 Conflict` — reservation already expired or released

---

### `POST /api/reservations/:id/release`
                                                        IMPORTANT NOTE
Immediately releases a `PENDING` reservation and restores held inventory.
Cron-based expiry (implemented)

Originally implemented using:

Vercel cron job
/api/cron/release-expired

The cron endpoint automatically released expired reservations every minute.

> Why cron is disabled in production

The deployed project currently uses the Vercel ##Hobby plan, which has limitations around cron scheduling for this setup.

To keep deployment simple and stable, the project currently relies on lazy cleanup.

Lazy Cleanup (currently active)
Expired reservations are automatically cleaned whenever users interact with the application.

Cleanup runs during:

GET /api/products
GET /api/reservations/:id
reservation confirmation flow

This means:
expired holds still release correctly
inventory returns automatically
no manual cleanup is required

Difference:
cleanup occurs during user activity
not on a fixed background schedule

---

## 🚀 Local Setup

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/inventory-reservation-system.git
cd inventory-reservation-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create `.env` in the root:

```env
DATABASE_URL=...            # Supabase pooled connection
DIRECT_URL=...              # Supabase direct connection (for migrations)
RESERVATION_TTL_MINUTES=10  # How long holds last
CRON_SECRET=your-secret     # Protects the cron endpoint
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Get `DATABASE_URL` and `DIRECT_URL` from:  
> **Supabase Dashboard → Connect → ORMs → Prisma**

### 4. Set up the database

```bash
npm run db:setup
```

This runs Prisma migrations and seeds warehouses, products, and demo inventory.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🧪 Concurrency Testing

Product **`HD-RACE-99`** is seeded with exactly **1 unit in Bengaluru** — intentionally scarce for race condition testing.

Send two simultaneous reservation requests:

```bash
# Terminal 1
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"productId":"HD-RACE-99","warehouseId":"bengaluru","quantity":1}'

# Terminal 2 (same time)
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"productId":"HD-RACE-99","warehouseId":"bengaluru","quantity":1}'
```

**Expected result:** One `201 Created`, one `409 Conflict`. Always. Guaranteed by the atomic update.

Or use the included script:

```bash
npm run test:concurrency
```

---

## ⚖️ Design Trade-offs

| Decision | Rationale |
|---|---|
| **PostgreSQL atomic updates over Redis locks** | Simpler architecture, fewer moving parts, sufficient for most workloads |
| **Polling over WebSockets** | Dramatically reduced infrastructure complexity with acceptable UX |
| **Lazy expiry cleanup** | Keeps the app fully functional on Vercel Hobby without paid cron |
| **No authentication** | Scope-focused — reservation logic is the deliverable, not auth |

---

## 🛣️ Roadmap

- [ ] WebSocket / SSE for real-time inventory updates
- [ ] Redis distributed locking for ultra-high-concurrency scenarios
- [ ] Background worker for scheduled expiry cleanup
- [ ] Admin dashboard — reservation analytics, warehouse management
- [ ] User authentication + reservation history
- [ ] Warehouse prioritization / routing logic
- [ ] Reservation conversion analytics

---

## 📁 Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── api/                  # Route handlers
│   │   │   ├── products/
│   │   │   ├── warehouses/
│   │   │   ├── reservations/
│   │   │   └── cron/
│   │   └── page.tsx              # Frontend entry
│   ├── lib/
│   │   └── inventory/            # Reservation business logic
│   └── components/               # UI components
├── prisma/
│   ├── schema.prisma             # Data model
│   ├── migrations/               # Migration history
│   └── seed.ts                   # Demo data seeder
├── scripts/
│   └── test-concurrency.ts       # Parallel request test
└── .env.example
```

---

## 📄 License

MIT — Built as a take-home assignment for Allo Engineering.

---

<div align="center">

**Built with precision. Designed for correctness.**

*The last unit always goes to exactly one customer.*

</div>
