/**
 * Resolve the secret used to sign and verify session JWTs.
 *
 * - Production: AUTH_SECRET is required, must be at least 32 characters and must not be a
 *   known placeholder/example value. Otherwise this throws (messages never include the value).
 * - Anywhere else (development, test): falls back to a fixed dev-only secret.
 *
 * The returned value is the raw environment value so existing sessions stay valid.
 */
const DEV_FALLBACK_SECRET = "dev-secret-only";
export const MIN_AUTH_SECRET_LENGTH = 32;
/** Cheap sanity guard against repeating patterns; not a randomness/entropy check. */
export const MIN_AUTH_SECRET_DISTINCT_CHARS = 8;

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^change[-_ ]?me/i,
  /dev-secret/i,
  /^pathly-pilot-secret/i,
  /^your[-_ ]/i,
  /^(.)\1+$/, // one repeated character
];

type AuthSecretEnv = { NODE_ENV?: string; AUTH_SECRET?: string };

export function getAuthSecret(env: AuthSecretEnv = process.env): string {
  const raw = env.AUTH_SECRET;

  if (env.NODE_ENV !== "production") {
    return raw || DEV_FALLBACK_SECRET;
  }

  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    throw new Error("AUTH_SECRET is required in production but is not set.");
  }
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed))) {
    throw new Error(
      "AUTH_SECRET looks like a placeholder or example value. Generate a random secret (for example: openssl rand -base64 48).",
    );
  }
  if (trimmed.length < MIN_AUTH_SECRET_LENGTH) {
    throw new Error(
      `AUTH_SECRET is too short for production (minimum ${MIN_AUTH_SECRET_LENGTH} characters).`,
    );
  }
  if (new Set(trimmed).size < MIN_AUTH_SECRET_DISTINCT_CHARS) {
    throw new Error(
      `AUTH_SECRET has too little variety for production (minimum ${MIN_AUTH_SECRET_DISTINCT_CHARS} distinct characters). Use a randomly generated value.`,
    );
  }
  return raw as string;
}
