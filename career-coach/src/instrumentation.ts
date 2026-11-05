/**
 * Runs once when the Next.js server starts. Fails fast in production if AUTH_SECRET is
 * missing or weak, instead of failing at first login (or silently logging everyone out).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Do not require runtime secrets while building.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NODE_ENV !== "production") return;

  const { getAuthSecret } = await import("./lib/authSecret");
  getAuthSecret();
}
