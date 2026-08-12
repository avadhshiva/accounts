# Deploy Pathly for a 48-hour student pilot

## Goal
Give 4–5 students a **public URL**, 48-hour trial, collect feedback. **No payment screen.**

## Where to deploy (pick one)

### 1) Railway (recommended for this MVP)
1. https://railway.app → New Project → Deploy from GitHub  
2. Repo: `avadhshiva/accounts` · branch `cursor/ai-career-coach-mvp-8c82`  
3. **Root directory:** `career-coach`  
4. Build: `npm install && npm run build`  
5. Start: `npm run start`  
6. Variables (copy from `.env.example`):
   - `AUTH_SECRET` = long random string  
   - `PILOT_MODE=true`  
   - `TRIAL_MINUTES=2880`  
   - optional `NEXT_PUBLIC_FEEDBACK_FORM_URL` = your Google Form link  
7. Add a **volume** at `/app/data` (or path matching `data/`) so signups/feedback persist  
8. Generate domain → share `https://your-app.up.railway.app`

### 2) Render
Same idea: Web Service, root `career-coach`, build/start as above, persistent disk for `data/`.

### Avoid for now: plain Vercel
JSON file DB can reset on serverless. Use Vercel only after Postgres/Turso.

## What to send students (WhatsApp template)
```
Hi! You're in the Pathly pilot (campus→corporate prep).

URL: https://YOUR-URL
1) Sign up
2) You get 48 hours to explore (timer on top)
3) Try: Resume, Interview, Learn roadmap, Aptitude
4) Tap Feedback and rate / suggest

No payment in this round — your feedback decides what we build next.
```

## After feedback
Turn payment on later with `PILOT_MODE=false` and Razorpay — not before.
