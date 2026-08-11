# Pathly — AI Career Coach (MVP)

Campus-to-corporate practice app for Indian engineering students:
- Resume ATS-style scoring + rewrites
- Mock interviews (HR / GenAI / SDE)
- GenAI basics learning track
- Free limits + one-click Pro for test users

## Quick start (test users tomorrow)

```bash
cd career-coach
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

1. Click **Start free** and create an account
2. Paste a resume on `/resume`
3. Try a mock interview on `/interview`
4. Complete a GenAI lesson on `/learn`
5. On Dashboard, click **Enable Pro for testing** if you hit free limits

### Optional live AI

Add to `.env.local`:

```
GEMINI_API_KEY=your_key
# or
OPENAI_API_KEY=your_key
```

If neither key is set, Pathly uses a built-in mock coach so demos still work.

## Notes

- Data is stored in `data/db.json` (local MVP; swap to Postgres later)
- Razorpay / GST / production legal review come after pilot feedback
- Do not promise placements in outreach messages
