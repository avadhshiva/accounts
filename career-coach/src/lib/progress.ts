const KEY = "pathly_learn_progress_v1";

import { mergeProgress, normalizeCompleted, progressSetsEqual } from "@/lib/learn/merge";

export type LearnProgress = {
  completed: string[]; // lesson slugs
  updatedAt: string;
};

function empty(): LearnProgress {
  return { completed: [], updatedAt: new Date().toISOString() };
}

export function loadProgress(): LearnProgress {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as LearnProgress;
    return {
      completed: normalizeCompleted(
        Array.isArray(parsed.completed) ? parsed.completed : [],
      ),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return empty();
  }
}

export function saveProgress(progress: LearnProgress) {
  if (typeof window === "undefined") return;
  const normalized = {
    completed: normalizeCompleted(progress.completed),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(normalized));
}

export function isComplete(slug: string, progress = loadProgress()) {
  return progress.completed.includes(slug);
}

export async function fetchServerProgress(): Promise<LearnProgress | null> {
  try {
    const res = await fetch("/api/learn/progress");
    if (!res.ok) return null;
    const data = await res.json();
    const completed = Array.isArray(data.progress?.completed) ? data.progress.completed : [];
    return {
      completed: normalizeCompleted(completed),
      updatedAt: data.progress?.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function pushServerProgress(progress: LearnProgress): Promise<boolean> {
  try {
    const res = await fetch("/api/learn/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: normalizeCompleted(progress.completed) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Merge localStorage with server progress (union), persist locally, and push if server
 * was behind. See mergeProgress docs for cross-device incomplete limitation.
 */
export async function hydrateLearnProgress(): Promise<LearnProgress> {
  const local = loadProgress();
  const server = await fetchServerProgress();
  if (!server) {
    return local;
  }
  const merged = mergeProgress(local, server);
  saveProgress(merged);
  if (!progressSetsEqual(server, merged)) {
    void pushServerProgress(merged);
  }
  return merged;
}

export function markComplete(slug: string) {
  const progress = loadProgress();
  const normalized = normalizeCompleted([slug])[0];
  if (!normalized) return progress;
  if (!progress.completed.includes(normalized)) {
    progress.completed.push(normalized);
    saveProgress(progress);
  }
  const saved = loadProgress();
  void pushServerProgress(saved);
  return saved;
}

export function markIncomplete(slug: string) {
  const progress = loadProgress();
  progress.completed = progress.completed.filter((s) => s !== slug);
  saveProgress(progress);
  const saved = loadProgress();
  void pushServerProgress(saved);
  return saved;
}

export function trackPercent(lessonSlugs: string[], progress = loadProgress()) {
  if (!lessonSlugs.length) return 0;
  const done = lessonSlugs.filter((s) => progress.completed.includes(s)).length;
  return Math.round((done / lessonSlugs.length) * 100);
}
