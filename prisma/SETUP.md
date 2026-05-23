# Database setup (one-time) — Supabase

1. Create a project at [Supabase](https://supabase.com).
2. **Project Settings → Database → Reset database password** (copy the new password once).
3. **Connect → ORMs → Prisma** — copy both URLs into `.env` (not only `.env.local`; Prisma CLI reads `.env`).
4. URL-encode special characters in the password (`@` → `%40`, `#` → `%23`, etc.).
5. Run:

```bash
npm run db:setup
```

**Already done in this repo:** `prisma init`, schema with `directUrl`, and `prisma` in `package.json` — you do **not** need to run those again.

**Auth error (P1000)?** Password or encoding is wrong — reset in Supabase and paste fresh strings from the Prisma tab.

This applies migrations and seeds demo products (including `HD-RACE-99` with 1 unit in BLR for concurrency testing).
