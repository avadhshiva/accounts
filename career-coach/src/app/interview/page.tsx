import { Suspense } from "react";
import InterviewClient from "./InterviewClient";

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[var(--ink-soft)]">
          Loading…
        </div>
      }
    >
      <InterviewClient />
    </Suspense>
  );
}
