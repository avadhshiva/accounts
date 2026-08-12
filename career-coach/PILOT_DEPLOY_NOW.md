# Deploy Pathly now — share link with 4–5 students

**Recommended: Railway** (easiest persistent storage for pilot signups + feedback).

---

## Option A — Railway (recommended, ~15 min)

### 1. Push is already on GitHub
- Repo: `https://github.com/avadhshiva/accounts`
- Branch: **`cursor/ai-career-coach-mvp-8c82`**
- App folder: **`career-coach`**

### 2. Create Railway project
1. Open https://railway.app and sign in with **GitHub**
2. **New Project** → **Deploy from GitHub repo**
3. Select **`avadhshiva/accounts`**
4. If it asks for a branch, choose **`cursor/ai-career-coach-mvp-8c82`**

### 3. Set root directory
1. Click the service → **Settings**
2. **Root Directory** → `career-coach`
3. Save (Railway will redeploy)

### 4. Environment variables
**Variables** tab → add:

| Variable | Value |
|----------|--------|
| `AUTH_SECRET` | Any long random string (32+ chars) e.g. `pathly-pilot-secret-aug2026-xyz123` |
| `PILOT_MODE` | `true` |
| `TRIAL_MINUTES` | `2880` |
| `ALLOW_MANUAL_UNLOCK` | `false` |
| `ALLOW_TEST_PRO` | `false` |
| `NEXT_PUBLIC_APP_NAME` | `Pathly` |
| `NEXT_PUBLIC_APP_URL` | Your Railway URL (add after step 5) |

Optional: `NEXT_PUBLIC_FEEDBACK_FORM_URL` = your Google Form link

### 5. Persistent disk (important)
So student accounts don’t disappear on redeploy:
1. Service → **Volumes** → **Add Volume**
2. Mount path: **`/app/data`** (or `/workspace/career-coach/data` — if signups vanish, try the other)
3. Size: 1 GB is enough

### 6. Public URL
1. **Settings** → **Networking** → **Generate Domain**
2. You get something like: `https://pathly-pilot-production.up.railway.app`
3. Copy this — **this is what you send students**

### 7. Smoke test (you first)
1. Open the URL in phone + laptop
2. Sign up with a **new email**
3. See **Start trial timer** → click it
4. Try Resume + Feedback
5. Only then share with students

---

## Option B — Render (alternative)

1. https://dashboard.render.com → **New** → **Blueprint**
2. Connect repo `avadhshiva/accounts`, branch `cursor/ai-career-coach-mvp-8c82`
3. Render reads `render.yaml` at repo root (disk + env pre-configured)
4. After deploy, copy `https://pathly-pilot.onrender.com` (name may vary)

**Note:** Free tier may sleep after inactivity — first load can be slow. OK for 4–5 testers.

---

## Do NOT use Vercel yet
File-based `data/db.json` resets on serverless. Use Railway/Render until Postgres is added.

---

## WhatsApp message for students

```
Hi! You're in the Pathly pilot — campus→corporate prep (resume, mocks, roadmaps, aptitude).

🔗 https://YOUR-RAILWAY-URL

Steps:
1) Sign up (use your real email)
2) Tap "Start trial timer" — then you get 48 hours
3) Try: Resume, Interview, Learn, Aptitude
4) Tap Feedback — rate us + tell what to improve

No payment in this round. Honest feedback helps us build what students actually need.
Thanks!
```

---

## If something breaks

| Problem | Fix |
|---------|-----|
| Signups lost after redeploy | Add/fix Railway volume on `data/` |
| Build fails | Root directory must be `career-coach` |
| Old trial screen | New signup email or delete volume data |
| Slow first load (Render free) | Wait 30–60s or use Railway |

---

## After 4–5 feedbacks
1. Read feedback in app (`data/db.json` on server) or Google Form
2. Fix top issues
3. Then add Razorpay ₹500 (`PILOT_MODE=false` later)
