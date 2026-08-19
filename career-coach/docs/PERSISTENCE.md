# Pathly — PostgreSQL persistence

Pathly stores production data in **PostgreSQL** (Supabase recommended). The legacy `data/db.json` file remains for **explicit local development only**.

## Storage modes

| Environment | Configuration |
|-------------|---------------|
| **Production (Render)** | `DATABASE_URL` required — no JSON fallback |
| **Local with Postgres** | `DATABASE_URL=postgresql://...` |
| **Local JSON dev** | `STORAGE_BACKEND=json` (omit `DATABASE_URL`) |

Production **must not** run without `DATABASE_URL`.

## Setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Copy **Database → Connection string → URI** (use pooler if offered)
3. Set `DATABASE_URL` in Render (Environment) and locally in `.env.local`
4. Run schema migration:

```bash
cd career-coach
npm install
npm run db:migrate
```

## Migrate existing `data/db.json`

If you have pilot data in `data/db.json`:

```bash
cd career-coach
DATABASE_URL=postgresql://... npm run db:import-json
# optional path: npm run db:import-json /path/to/db.json
```

This **upserts** records — it does not delete the JSON file or overwrite unrelated rows.

## Render deployment

1. Add environment variable in Render dashboard:
   - `DATABASE_URL` = your Supabase connection string (mark as secret)
2. Keep existing vars: `AUTH_SECRET`, `PILOT_MODE`, `TRIAL_MINUTES`, Brevo keys, etc.
3. After first deploy with `DATABASE_URL`, run migrations once:

```bash
# From your machine with DATABASE_URL set, or use Render shell:
npm run db:migrate
```

Optional release command on Render:

```
npm run db:migrate && npm start
```

## Schema

SQL lives in `src/lib/db/schema.sql`. Tables:

- `users` — accounts, trial, usage, session version
- `resumes` — resume analyses
- `interviews` — mock interview sessions
- `feedback` — pilot feedback
- `password_reset_tokens` — reset flow
- `user_progress` — learn lesson completions (`learn_completed` JSONB slug array)
- `aptitude_attempts` — foundation for future aptitude sync (unused by UI)

## Learn progress API

Authenticated users (trial/active access):

- `GET /api/learn/progress` → `{ progress: { completed: string[], updatedAt } }`
- `PATCH /api/learn/progress` → body `{ completed: string[] }` (valid lesson slugs only)

Client sync (`src/lib/progress.ts`):

- On Learn entry: union-merge `pathly_learn_progress_v1` with server, dual-write
- Mark complete/incomplete: localStorage first, then PATCH (failure does not block UI)
- Cross-device incomplete is not perfectly reconciled — union merge preserves completions

## Tests

```bash
# JSON isolation test (no database)
STORAGE_BACKEND=json npm test

# Full PostgreSQL integration tests
DATABASE_URL=postgresql://... npm test
```

## Security

- Never commit `DATABASE_URL`
- Never expose `DATABASE_URL` to the browser (`NEXT_PUBLIC_*`)
- All queries use parameterized statements via `pg`
