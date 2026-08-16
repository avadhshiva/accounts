# Pathly Product Revamp Plan

**Document version:** 1.0  
**Date:** 2026-08-16  
**Branch:** `cursor/pathly-product-revamp-8c82`  
**Status:** Phase 0 complete → Phase 1 in progress

---

## Executive summary

Pathly is a **Next.js 16 modular monolith** deployed to **Render** (free tier) with a **JSON file database** (`data/db.json`). The MVP already delivers resume scoring, mock interviews (4 modes), learning tracks, aptitude drills, trial/access control, and email password reset.

The revamp transforms Pathly from a **feature menu** into a **placement readiness platform** centered on:

> **ASSESS → IDENTIFY GAPS → PRACTICE → IMPROVE → REASSESS**

This document captures the repository audit, gaps, recommended architecture, phased plan, and security/monetization considerations. **No destructive rewrite** — extend working modules incrementally.

---

## A. Current architecture

### Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.3 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4 |
| Auth | JWT in httpOnly cookie (`pathly_session`), bcrypt passwords, jose |
| Validation | Zod 4 |
| Storage | File-based JSON (`data/db.json`) via `src/lib/store.ts` |
| AI | Gemini 2.0 Flash (primary) or OpenAI gpt-4o-mini (fallback); mock when no keys |
| Email | Brevo HTTP API (Render-compatible), Resend, Gmail SMTP fallback |
| Deploy | Render (`render.yaml`), rootDir `career-coach`, Node 20 |
| Repo | Monorepo `avadhshiva/accounts` — app in `career-coach/` |

### Directory structure (app)

```
career-coach/
├── src/
│   ├── app/                    # Pages + API routes (App Router)
│   │   ├── api/
│   │   │   ├── auth/           # signup, login, logout, me, forgot/reset password
│   │   │   ├── access/         # trial start, status, unlock
│   │   │   ├── resume/         # analyze
│   │   │   ├── interview/      # start, reply
│   │   │   └── feedback/
│   │   ├── dashboard/          # Day-1 guided flow
│   │   ├── resume/             # Resume Studio (client)
│   │   ├── interview/          # Mock interview (client)
│   │   ├── learn/              # Tracks + lessons
│   │   ├── practice/           # Aptitude drill (client)
│   │   ├── unlock/             # Trial gate
│   │   └── ...auth pages
│   ├── components/             # AppShell, AppShellClient, PasswordInput, etc.
│   └── lib/                    # Core business logic
│       ├── auth.ts             # Sessions, JWT, publicUser
│       ├── store.ts            # JSON DB read/write
│       ├── types.ts            # User, Resume, Interview, DbShape
│       ├── access.ts           # Trial/pilot logic
│       ├── limits.ts           # Usage caps
│       ├── ai.ts               # Resume + interview AI (Gemini/OpenAI/mock)
│       ├── guard.ts            # API access gate
│       ├── content.ts          # Learn tracks + interview mode metadata
│       ├── aptitude.ts         # Question bank
│       ├── progress.ts         # Learn progress (localStorage only)
│       └── email.ts            # Multi-provider email
├── data/db.json                # Gitignored; ephemeral on Render free
└── render.yaml
```

### Request flow

```
Browser → Next.js page (RSC or client)
       → API route → getSessionUser() → assertFeatureAccess()
       → readDb/updateDb → ai.ts (optional) → JSON response
```

### Authentication & sessions

- **Signup/login:** email + password; JWT cookie, 30-day maxAge
- **Single active session:** `sessionVersion` bumped on login; old tokens invalidated
- **Password reset:** crypto token in DB, 1hr TTL, Brevo email
- **Trial gate:** user must click "Start trial" on `/unlock`; `TRIAL_MINUTES` (default 10080 = 7 days)
- **Access levels:** `trial` | `paid` | `invite`
- **Logout:** server action (AppShell) or POST `/api/auth/logout` (AppShellClient)

### AI architecture (current)

- Monolithic `ai.ts` with provider calls inline (not abstracted)
- JSON extraction via brace slicing (fragile)
- Mock fallbacks when keys missing or on error
- No rate limiting, no usage metering per AI call
- Secrets server-side only ✓

### State management

- **Server:** `db.json` for users, resumes, interviews, feedback, reset tokens
- **Client:** React `useState` on feature pages
- **Learn progress:** `localStorage` only (`pathly_learn_progress_v1`) — **not tied to user account**
- **Aptitude drill:** in-memory only — **not persisted**

### Deployment

- **Render free tier:** no persistent disk → `db.json` resets on redeploy/restart
- **Health check:** `/`
- **Env vars:** see `.env.example` and `render.yaml`

---

## B. Current features

| Feature | Route | Persistence | Limits |
|---------|-------|-------------|--------|
| Landing | `/` | — | Public |
| Signup/login | `/signup`, `/login` | User in DB | — |
| Trial unlock | `/unlock` | `trialStartedAt` | Manual start |
| Dashboard | `/dashboard` | Reads DB | Guided day-1 steps |
| Resume scoring | `/resume` | `resumes[]` | 3 (pilot) / plan limits |
| Mock interview | `/interview` | `interviews[]` | 2 (pilot) |
| Learn tracks | `/learn`, `/learn/[slug]` | localStorage only | None |
| Aptitude drill | `/practice` | None | None |
| Feedback | `/feedback` | `feedback[]` | — |
| Forgot password | `/forgot-password` | tokens in DB | — |
| Pro/test unlock | `/api/access/unlock` | access field | invite codes |

### Learn content

- 3 tracks: GenAI, Technical/Coding, Aptitude & Reasoning
- Lessons with body, quiz, visual roadmap (`TrackRoadmap.tsx`)
- ~471 lines in `content.ts`

### Interview modes

- HR, GenAI, Technical, Aptitude
- Random question sets (`interviewQuestions.ts`)
- Scorecard: overall, communication, clarity, depth

---

## C. Current technical debt

### P0 (blocks pilot revenue)

| Issue | Impact |
|-------|--------|
| **JSON DB ephemeral on Render free** | Users lost on redeploy; forgot-password appears broken |
| **Learn progress in localStorage** | Lost on device switch; not in college analytics |
| **Aptitude not persisted** | Cannot feed Placement Readiness Score |
| **Minimal user profile** | Only name, email, college, targetRole (default "SDE Fresher") |
| **Fake readiness on landing** | Static "78/100" on homepage — contradicts "no fake scores" principle |

### P1 (quality & scale)

| Issue | Impact |
|-------|--------|
| No automated tests | Regressions likely during revamp |
| AI logic not abstracted | Hard to add Coach, structured outputs, provider swap |
| No rate limiting | AI abuse / cost risk |
| JSON parse for AI responses | Brittle; needs Zod validation |
| Duplicate AppShell / AppShellClient | Nav logic duplicated |
| No Google OAuth | Signup friction for students |
| No entitlements layer | Limits hardcoded in `limits.ts` |
| No analytics | Cannot measure activation/conversion |
| Landing copy outdated | "AI career coach" vs placement readiness positioning |

### P2 (future)

- No college/org/cohort model in DB
- No payment integration (intentional for pilot)
- No Capacitor/mobile packaging
- Spring Boot `accounts/` module unrelated to Pathly app
- README still says 30-min trial / 48h deploy docs inconsistent with 7-day pilot

### Dead / low-use code

- `accounts/` Java Spring Boot scaffold — separate from Pathly
- `EnableProButton.tsx` — test helper, pilot may hide
- `railway.json` — alternate deploy path, undocumented in render.yaml

---

## D. Recommended architecture

### Principle: modular monolith

Keep Next.js App Router. Add **domain modules** under `src/lib/`:

```
src/lib/
├── domains/
│   ├── profile/        # Student profile, completion
│   ├── readiness/      # Placement Readiness Score (Phase 2)
│   ├── roadmap/        # Personalized plan (Phase 3)
│   ├── coach/          # Pathly Coach (Phase 4)
│   ├── interviews/     # Extract from ai.ts (Phase 5)
│   ├── resume/         # Resume intelligence (Phase 6)
│   ├── aptitude/       # Attempts, topic scores (Phase 1/7)
│   ├── companies/      # Company prep metadata (Phase 6)
│   └── organizations/  # College B2B (Phase 8)
├── ai/
│   ├── provider.ts     # Gemini/OpenAI abstraction
│   ├── prompts/        # Task-specific prompts
│   └── validate.ts     # Zod schemas for LLM JSON
├── entitlements.ts     # Plan → limits (Phase 1 stub)
├── analytics.ts        # Event abstraction (Phase 1 stub)
└── store.ts            # Storage interface → file now, Postgres later
```

### Storage migration path

1. **Now:** Extend `db.json` schema; normalize on read (`ensureDbShape`)
2. **Phase 1.1 (recommended before paid pilot):** Supabase Postgres or Render paid disk
3. **Later:** Keep storage behind `readDb`/`updateDb` interface — swap implementation

### AI architecture (target)

```
API route → domain service → ai/provider → prompt template
          → Zod validate → persist result → analytics event
```

---

## E. Proposed data model

### Existing (keep)

- `User`, `ResumeAnalysis`, `InterviewSession`, `FeedbackEntry`, `PasswordResetToken`

### Phase 1 additions

```typescript
UserProfile {
  degree?: string
  branch?: string
  graduationYear?: number
  currentYear?: string          // e.g. "3rd year"
  targetCompany?: string
  preparationTimeline?: string  // e.g. "14 days"
  codingExperience?: string
  programmingLanguage?: string
  skillLevel?: "beginner" | "intermediate" | "advanced"
  linkedinUrl?: string
  githubUrl?: string
  resumeText?: string           // latest pasted resume
  profileCompletedAt?: string
  onboardingStep?: number
}

UserProgress {
  userId: string
  learnCompleted: string[]      // lesson slugs
  updatedAt: string
}

AptitudeAttempt {
  id: string
  userId: string
  createdAt: string
  score: number
  total: number
  accuracy: number
  durationSec?: number
  topicBreakdown: { topic: string; correct: number; total: number }[]
}
```

### Phase 2+ additions

```typescript
ReadinessSnapshot {
  userId, computedAt, overall?: number
  categories: { id, label, score?, status: "complete" | "insufficient_data" }
  gaps: string[]
  strengths: string[]
  nextActions: string[]
}

Roadmap {
  userId, targetRole, durationDays, items: RoadmapItem[], status
}

AIConversation { userId, messages[], context }

Organization { name, slug }
Cohort { orgId, name, workshopCode, startsAt }
Subscription { userId, plan, entitlements, expiresAt }
```

### B2B-ready fields on User (Phase 1 stub)

```typescript
organizationId?: string
cohortId?: string
signupSource?: string  // "workshop", "organic", "college-xyz"
```

---

## F. Proposed user journeys

### Journey 1: New student (pilot)

1. Land on `/` → "Check My Placement Readiness"
2. Sign up → pick target role (dropdown)
3. `/unlock` → Start 7-day trial
4. `/profile` → complete college, branch, graduation year, target company
5. Dashboard shows **readiness placeholder** until assessments done
6. Resume assessment → mock interview → aptitude drill → learn module
7. Dashboard updates **next action** based on gaps (Phase 2)
8. Feedback → unlock extension / college follow-up

### Journey 2: Returning student

1. Login → session restored (JWT)
2. Dashboard: readiness score + today's action + roadmap progress
3. Coach for ad-hoc questions (Phase 4)

### Journey 3: College workshop (future)

1. QR with `?source=gprec-2026` → signup tagged to cohort
2. Free readiness assessment in room
3. Personal score on phone
4. Paid upgrade / college license

---

## G. Phase 1 implementation plan

**Goal:** Reliable foundation — profile, server progress, no regressions.

| Task | Priority |
|------|----------|
| Extend `User` + profile fields | P0 |
| Profile API GET/PATCH | P0 |
| Profile page `/profile` | P0 |
| Target role dropdown (10 roles) | P0 |
| Server-side learn progress | P0 |
| Aptitude attempt persistence | P0 |
| `ensureDbShape` migration | P0 |
| Analytics + entitlements stubs | P1 |
| API error helper | P1 |
| Vitest unit tests | P1 |
| Document Supabase migration | P0 |
| Mobile check profile forms | P1 |

**Not in Phase 1:** Readiness score, Coach, Roadmap, Company prep, landing redesign, payments, Google OAuth.

---

## H. Phase 2 implementation plan — Placement Readiness Score

1. `src/lib/domains/readiness/compute.ts` — deterministic scoring from:
   - Latest resume score → Resume category
   - Latest interview scorecards by mode → HR, Technical, GenAI, Communication
   - Aptitude attempts → Aptitude category
   - Learn progress % → partial signal
2. Return `insufficient_data` when category has no attempts
3. Dashboard hero: overall + breakdown + top 3 gaps
4. Unit tests: no fake scores when data missing
5. Remove static "78" from landing (replace with CTA)

---

## I. Phase 3 — Personalized roadmap

1. Generate 7/14-day plan from gaps + target role + timeline
2. Store `Roadmap` in DB; daily items link to existing features
3. Recompute on new assessment completion
4. Dashboard "Day N of 14"

---

## J. Phase 4 — Pathly Coach

1. `/coach` chat UI
2. Context injection: profile + readiness + recent attempts (structured)
3. AI abstraction layer; prompt: never invent student data
4. Entitlement: PRO only (configurable)
5. Rate limit per user/day

---

## K. Phase 5 — Enhanced mock interviews

1. Expand scorecard dimensions (answer structure, problem solving, role knowledge)
2. Coding mode distinction from technical Q&A
3. Role-specific question banks per `TARGET_ROLES`
4. Interview history on dashboard

---

## L. Phase 6 — Company & resume intelligence

1. `companies.ts` metadata (TCS, Infosys, …) — generalized prep guidance
2. Resume sections: ATS readability, role alignment, quantification
3. Target company passed to resume analyze prompt

---

## M. Phase 7 — Analytics & monetization

1. Wire analytics provider (PostHog/Plausible/custom)
2. Entitlements from config/env
3. Admin `/admin` (internal): user counts, popular roles — protect with `ADMIN_SECRET`

---

## N. Phase 8 — College architecture

1. Organization + Cohort tables
2. Workshop signup codes
3. TPO CSV export
4. College dashboard (v1)

---

## O. Phase 9 — Mobile / Capacitor

1. Audit all pages at 360/390/412px
2. Safe areas, touch targets
3. Capacitor wrapper + deep links

---

## P. Risks

| Risk | Mitigation |
|------|------------|
| Render data loss | Supabase before charging students |
| AI cost spike | Rate limits, mock mode, entitlements |
| Scope creep | Phase gates; ship readiness before Coach |
| Fake scores backlash | Never compute without data; label clearly |
| Trademark/branding | Pathly name kept per this revamp spec |
| JSON race conditions | Single-instance OK on Render; move to DB for scale |

---

## Q. Security considerations

| Area | Current | Action |
|------|---------|--------|
| API keys | Server-only ✓ | Keep; audit `NEXT_PUBLIC_*` |
| AUTH_SECRET | Required; dev fallback weak | Enforce in production |
| Session | httpOnly, secure in prod ✓ | Keep |
| Authorization | userId checks on interview/resume ✓ | Extend to progress/profile |
| Email enumeration | Forgot-password returns generic ✓ | Keep |
| Rate limiting | None | Add Phase 1.1 on auth + AI routes |
| Prompt injection | User resume/interview text in prompts | Sanitize length; system prompts |
| XSS | React default escaping | Avoid `dangerouslySetInnerHTML` |
| CSRF | SameSite=lax cookies | OK for JSON API |
| File upload | Text paste only | No file upload attack surface |
| Logging | console.error on email fail | Never log passwords/tokens |

---

## R. Monetization architecture

### Plans (config-driven, not hardcoded)

| Plan | resume | mocks | coach | roadmap |
|------|--------|-------|-------|---------|
| FREE | 1 | 1 | — | view only |
| PRO | unlimited | expanded | yes | full |
| PREMIUM | unlimited | unlimited | priority | full |
| COLLEGE | per cohort | per cohort | optional | cohort |

### Implementation

- `src/lib/entitlements.ts` — `getEntitlements(plan)`, `canUseFeature(user, feature)`
- Refactor `limits.ts` to use entitlements
- `User.plan` + future `Subscription` entity
- No Razorpay until post-pilot

---

## S. Product gap analysis

| Vision feature | Current state | Phase |
|----------------|---------------|-------|
| Placement Readiness Score | Static fake on landing | 2 |
| Personalized roadmap | Static learn tracks | 3 |
| Pathly Coach | None | 4 |
| Enhanced mocks | Basic 4-mode | 5 |
| Company prep | None | 6 |
| Resume intelligence | Basic score + rewrites | 6 |
| Aptitude weakness tracking | Random 8 Q drill | 1 + 7 |
| GenAI track depth | Good starter content | 7+ |
| Dashboard action-first | Partial day-1 flow | 2 |
| College analytics | None | 8 |
| Profile | Minimal | **1** |
| Persistence | Ephemeral | **1** |

---

## T. UI/UX changes (by phase)

### Phase 1
- `/profile` form, mobile-friendly
- Role select on signup
- Nav: Profile link
- Dashboard nudge: "Complete profile"

### Phase 2
- Readiness hero card
- "Complete assessment to unlock" states
- Copy: "Readiness Score" not generic "Score"

### Phase 3+
- Roadmap timeline component
- Coach chat panel
- Company picker card
- Landing page sections per spec

---

## U. Files/modules to change (recommended)

### Phase 1 (this PR)

| File | Change |
|------|--------|
| `docs/PRODUCT_REVAMP_PLAN.md` | This document |
| `src/lib/types.ts` | Profile, progress, aptitude types |
| `src/lib/roles.ts` | Target role constants |
| `src/lib/profile.ts` | Validation, completion % |
| `src/lib/store.ts` | `ensureDbShape`, new collections |
| `src/lib/auth.ts` | Extended `publicUser` |
| `src/lib/progress.ts` | Server sync API |
| `src/lib/entitlements.ts` | New stub |
| `src/lib/analytics.ts` | New stub |
| `src/lib/api-response.ts` | Error helpers |
| `src/app/api/profile/route.ts` | GET/PATCH |
| `src/app/api/progress/route.ts` | GET/PUT |
| `src/app/api/aptitude/attempt/route.ts` | POST/GET |
| `src/app/profile/page.tsx` | Profile UI |
| `src/app/signup/page.tsx` | Role dropdown |
| `src/app/practice/page.tsx` | Save attempts |
| `src/app/dashboard/page.tsx` | Profile nudge |
| `src/components/AppShell*.tsx` | Profile nav |
| `vitest.config.ts` + `src/lib/__tests__/*` | Unit tests |
| `package.json` | vitest script |

### Phase 2+

| File | Change |
|------|--------|
| `src/lib/domains/readiness/*` | Score computation |
| `src/app/page.tsx` | Landing revamp |
| `src/lib/ai/provider.ts` | AI abstraction |
| `src/app/coach/*` | Coach UI + API |
| `src/lib/companies.ts` | Company metadata |

---

## V. Success metrics (instrumentation targets)

| Metric | Event |
|--------|-------|
| Activation | `profile_completed` |
| Assessment | `resume_assessed`, `mock_completed`, `aptitude_completed` |
| Engagement | weekly active users |
| Improvement | readiness delta (Phase 2) |
| Conversion | `subscription_started` (future) |
| College | students per `cohortId` (future) |

---

## W. Preservation checklist

Before each phase merge:

- [ ] Signup/login/logout works
- [ ] Trial start + expiry works
- [ ] Resume analyze + limits
- [ ] Interview start/reply + limits
- [ ] Learn pages load
- [ ] Aptitude drill works
- [ ] Forgot password sends email (if Brevo configured)
- [ ] `npm run build` passes
- [ ] Tests pass

---

*Next: Phase 1 implementation on branch `cursor/pathly-product-revamp-8c82`.*
