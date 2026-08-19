"use client";

import Link from "next/link";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="panel rounded-[1.5rem] p-6" role="alert">
      <h2 className="display text-2xl font-semibold">Couldn&apos;t load mission data</h2>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Something went wrong while loading your placement mission. Please try again.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary text-sm" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/dashboard" className="btn btn-ghost text-sm">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
