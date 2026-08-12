# Deploy Pathly (AI Career Coach)

## Recommended for this MVP

### Best now: **Railway** or **Render** (Node server)
Why: the app currently stores users in a local `data/db.json` file. Vercel serverless has an ephemeral filesystem, so data can reset between requests unless you add Postgres/Turso first.

1. Push branch `cursor/ai-career-coach-mvp-8c82`
2. Create a new Railway/Render web service from the GitHub repo
3. **Root directory:** `career-coach`
4. Build: `npm install && npm run build`
5. Start: `npm run start`
6. Set env vars from `.env.example` (especially `AUTH_SECRET`, `INVITE_CODES`)
7. Add a **persistent volume** mounted at `/app/data` (or project `data/`) so signups survive restarts

### Also good later: **Vercel**
Use when you migrate DB to Postgres/Neon/Turso + blob storage.
- Framework preset: Next.js
- Root: `career-coach`
- Same env vars
- Do **not** rely on `data/db.json` on Vercel without an external DB

## Trial cohort (4–10 students) without taking money yet
1. Deploy on Railway/Render
2. Share invite codes: `PATHLY-STUDENT` (or your own in `INVITE_CODES`)
3. Students: Signup → use trial timer → `/unlock` → enter invite code
4. Collect feedback on WhatsApp

## Security notes before public paid launch
- Rotate `AUTH_SECRET`
- Turn `ALLOW_TEST_PRO=false` and carefully control `ALLOW_MANUAL_UNLOCK`
- Add Razorpay (live) for ₹500 unlock
- Move off JSON file DB
- CA review for GST / invoices
