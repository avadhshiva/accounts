# Pathly — AI Career Coach (MVP)

Campus-to-corporate practice app for Indian engineering students:
- Resume ATS-style scoring + rewrites
- Mock interviews: **Technical/Coding**, **Aptitude**, HR, GenAI
- Learning tracks: GenAI, Coding & Technical, Aptitude & Reasoning
- **Interactive visual roadmaps** (click nodes, diagrams, checklists, progress %)
- Aptitude drill with explanations
- Free limits + one-click Pro for test users
- **30-min trial** after signup, then **/unlock** (invite code or ₹500 UPI/manual)
- **Single active login** (new login signs out older sessions)

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
