"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Track } from "@/lib/content";
import { loadProgress, trackPercent, type LearnProgress } from "@/lib/progress";

export function TrackRoadmap({
  track,
  progress: progressProp,
}: {
  track: Track;
  progress?: LearnProgress;
}) {
  const [progress, setProgress] = useState<LearnProgress>(progressProp || { completed: [], updatedAt: "" });

  useEffect(() => {
    setProgress(progressProp || loadProgress());
  }, [progressProp]);

  const percent = useMemo(
    () => trackPercent(
      track.lessons.map((l) => l.slug),
      progress,
    ),
    [track, progress],
  );

  const firstOpen = track.lessons.findIndex((l) => !progress.completed.includes(l.slug));

  return (
    <div className="panel overflow-hidden rounded-[1.75rem] p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            {track.tag} · interactive path
          </p>
          <h2 className="display text-3xl font-semibold">{track.title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">{track.description}</p>
        </div>
        <div className="min-w-[140px]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
            Progress
          </p>
          <p className="display text-3xl font-semibold">{percent}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--sand-2)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Desktop horizontal / mobile vertical roadmap */}
      <div className="mt-8">
        <div className="hidden md:block">
          <div className="relative px-2 pt-4">
            <div className="absolute left-8 right-8 top-[34px] h-[3px] rounded-full bg-[var(--sand-2)]" />
            <div
              className="absolute left-8 top-[34px] h-[3px] rounded-full bg-[var(--accent)] transition-all"
              style={{
                width:
                  track.lessons.length <= 1
                    ? percent > 0
                      ? "100%"
                      : "0%"
                    : `calc((100% - 4rem) * ${percent / 100})`,
              }}
            />
            <div className="relative grid gap-3" style={{ gridTemplateColumns: `repeat(${track.lessons.length}, minmax(0, 1fr))` }}>
              {track.lessons.map((lesson, idx) => {
                const done = progress.completed.includes(lesson.slug);
                const current = idx === firstOpen || (firstOpen === -1 && idx === track.lessons.length - 1);
                return (
                  <RoadNode
                    key={lesson.slug}
                    href={`/learn/${lesson.slug}`}
                    index={idx + 1}
                    title={lesson.title}
                    minutes={lesson.minutes}
                    summary={lesson.summary}
                    done={done}
                    current={current && !done}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="md:hidden">
          <ol className="relative space-y-4 border-l-2 border-[var(--sand-2)] ml-3 pl-6">
            {track.lessons.map((lesson, idx) => {
              const done = progress.completed.includes(lesson.slug);
              const current = idx === firstOpen;
              return (
                <li key={lesson.slug} className="relative">
                  <span
                    className={`absolute -left-[31px] top-2 h-4 w-4 rounded-full border-2 ${
                      done
                        ? "border-[var(--accent)] bg-[var(--accent)]"
                        : current
                          ? "border-[var(--accent)] bg-white"
                          : "border-[var(--sand-2)] bg-white"
                    }`}
                  />
                  <Link
                    href={`/learn/${lesson.slug}`}
                    className={`block rounded-2xl border p-4 ${
                      done
                        ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
                        : current
                          ? "border-[var(--accent)] bg-white"
                          : "border-[var(--line)] bg-white/70"
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                      {done ? "Done" : current ? "Up next" : `Lesson ${idx + 1}`} · {lesson.minutes} min
                    </p>
                    <p className="mt-1 font-semibold">{lesson.title}</p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">{lesson.summary}</p>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

function RoadNode({
  href,
  index,
  title,
  minutes,
  summary,
  done,
  current,
}: {
  href: string;
  index: number;
  title: string;
  minutes: number;
  summary: string;
  done: boolean;
  current: boolean;
}) {
  return (
    <Link href={href} className="group relative flex flex-col items-center text-center">
      <span
        className={`relative z-[1] flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
          done
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : current
              ? "border-[var(--accent)] bg-white text-[var(--accent)] shadow-[0_0_0_4px_rgba(15,118,110,0.15)]"
              : "border-[var(--sand-2)] bg-white text-[var(--ink-soft)] group-hover:border-[var(--accent)]"
        }`}
      >
        {done ? "✓" : index}
      </span>
      <div
        className={`mt-3 w-full rounded-2xl border p-3 transition group-hover:-translate-y-0.5 ${
          done
            ? "border-[var(--accent)]/25 bg-[var(--accent)]/5"
            : current
              ? "border-[var(--accent)] bg-white"
              : "border-[var(--line)] bg-white/70"
        }`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
          {minutes} min
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug">{title}</p>
        <p className="mt-1 line-clamp-2 text-[11px] text-[var(--ink-soft)]">{summary}</p>
      </div>
    </Link>
  );
}
