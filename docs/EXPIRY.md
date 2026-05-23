# Reservation expiry

Holds expire after `RESERVATION_TTL_MINUTES` (default 10). When they do, reserved units return to available stock.

## Production (primary): Vercel Cron

- **Route:** `GET /api/cron/release-expired`
- **Schedule:** every minute (`vercel.json`)
- **Auth:** `Authorization: Bearer <CRON_SECRET>` (set in Vercel env)

Vercel Cron calls this endpoint automatically on deploy.

## Backup: lazy cleanup

On these reads we also release expired pending holds:

- `GET /api/products`
- `GET /api/reservations/:id`
- `POST /api/reservations/:id/confirm`

So stock is freed even if cron is delayed by up to ~1 minute.

## Local manual test

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/release-expired
```
