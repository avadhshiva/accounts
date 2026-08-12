const KEY = "pathly_learn_progress_v1";

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
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return empty();
  }
}

export function saveProgress(progress: LearnProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    KEY,
    JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }),
  );
}

export function isComplete(slug: string, progress = loadProgress()) {
  return progress.completed.includes(slug);
}

export function markComplete(slug: string) {
  const progress = loadProgress();
  if (!progress.completed.includes(slug)) {
    progress.completed.push(slug);
    saveProgress(progress);
  }
  return progress;
}

export function markIncomplete(slug: string) {
  const progress = loadProgress();
  progress.completed = progress.completed.filter((s) => s !== slug);
  saveProgress(progress);
  return progress;
}

export function trackPercent(lessonSlugs: string[], progress = loadProgress()) {
  if (!lessonSlugs.length) return 0;
  const done = lessonSlugs.filter((s) => progress.completed.includes(s)).length;
  return Math.round((done / lessonSlugs.length) * 100);
}
