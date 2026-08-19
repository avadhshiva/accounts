import Link from "next/link";

export function MissionActionCard({
  step,
  title,
  description,
  href,
  done,
  primary,
}: {
  step: number;
  title: string;
  description?: string;
  href: string;
  done: boolean;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block min-h-[44px] rounded-2xl border p-4 transition hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
        done
          ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
          : primary
            ? "border-[var(--accent)] bg-white shadow-[0_8px_30px_rgba(15,28,46,0.06)]"
            : "border-[var(--line)] bg-white/70"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            done ? "bg-[var(--accent)] text-white" : "bg-[var(--sand-2)] text-[var(--ink)]"
          }`}
          aria-hidden="true"
        >
          {done ? "✓" : step}
        </span>
        <div>
          <p className="font-semibold">{title}</p>
          {description ? (
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{description}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
