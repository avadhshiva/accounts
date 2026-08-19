import { getAllLessons } from "@/lib/content";
import type { LearnProgress } from "@/lib/progress";

/** Canonical lesson slugs from static content — used to filter stored progress. */
export function getCanonicalLessonSlugs(): Set<string> {
  return new Set(getAllLessons().map((l) => l.slug));
}

/**
 * Filter to valid lesson slugs, dedupe, stable sort for persistence.
 */
export function normalizeCompleted(slugs: string[]): string[] {
  const valid = getCanonicalLessonSlugs();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const slug of slugs) {
    const trimmed = slug.trim();
    if (!trimmed || !valid.has(trimmed) || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out.sort();
}

function parseTimestamp(value: string | undefined): number {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/**
 * Union merge for Learn progress sync.
 *
 * Change 4 limitation: only completed slugs are stored — no per-device deletion
 * history. Cross-device "mark incomplete" is not perfectly reconciled; union
 * preserves any completion seen on either side. True tombstone sync is deferred.
 */
export function mergeProgress(local: LearnProgress, server: LearnProgress): LearnProgress {
  const completed = normalizeCompleted([...local.completed, ...server.completed]);
  const updatedAtMs = Math.max(parseTimestamp(local.updatedAt), parseTimestamp(server.updatedAt));
  return {
    completed,
    updatedAt: new Date(updatedAtMs || Date.now()).toISOString(),
  };
}

export function progressSetsEqual(a: LearnProgress, b: LearnProgress): boolean {
  const setA = new Set(normalizeCompleted(a.completed));
  const setB = new Set(normalizeCompleted(b.completed));
  if (setA.size !== setB.size) return false;
  for (const slug of setA) {
    if (!setB.has(slug)) return false;
  }
  return true;
}
