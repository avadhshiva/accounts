# Next plan (suggested)

## Phase 1 — Now (this week): feedback, not revenue
**Goal:** 4–10 students use the product and tell you what to fix.

1. Deploy (Railway/Render) — see `DEPLOY.md`
2. Give each student an **invite code** (skip real ₹500)
3. They get: signup → **30-min trial banner** → unlock via invite → full practice
4. Ask 5 questions: resume useful? mocks realistic? roadmap clear? pay ₹500? missing what?
5. Single-device login is already on (new login signs out old session)

**Do not** prioritize Razorpay yet if money will confuse feedback.

## Phase 2 — After feedback: harden + paywall
1. Fix top 3 UX complaints
2. Add Razorpay one-time ₹500 unlock (replace manual UPI)
3. Invoice/receipt + CA guidance
4. Move data to Postgres (needed for Vercel scale)
5. Optional: shorten/lengthen trial via `TRIAL_MINUTES`

## Phase 3 — Grow
1. Semester plan ₹999 (subscription)
2. More coding drills / company packs
3. Account-synced learn progress
4. College waitlist / referral

## Access model implemented
| State | What happens |
|-------|----------------|
| Signup | Trial starts (`TRIAL_MINUTES`, default 30) |
| During trial | Full product with countdown banner |
| Trial ends | APIs + app shell send user to `/unlock` |
| Invite code | `access=invite`, plan=pro |
| Manual UPI ref | Only if `ALLOW_MANUAL_UNLOCK=true` |
| New login | Bumps `sessionVersion` → old session invalid (**single active login**) |
