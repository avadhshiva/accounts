<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cloud Agent development

- App root: `career-coach/` (Next.js 16).
- Local dev uses JSON storage (`STORAGE_BACKEND=json` in `.env.local`); production requires `DATABASE_URL`.
- Dev server: `npm run dev` in `career-coach` → http://localhost:3000
- Tests: `STORAGE_BACKEND=json npm test` in `career-coach`
- Lint: `npm run lint` in `career-coach`
