"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { formatRemaining } from "@/lib/access";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/resume", label: "Resume" },
  { href: "/interview", label: "Interview" },
  { href: "/learn", label: "Learn" },
  { href: "/practice", label: "Aptitude" },
];

type AccessInfo = {
  allowed: boolean;
  access: string;
  reason: string;
  remainingLabel: string;
  remainingMs: number;
  trialStarted: boolean;
};

export function AppShellClient({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [planLabel, setPlanLabel] = useState("");
  const [access, setAccess] = useState<AccessInfo | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    fetch("/api/auth/me")
      .then(async (r) => {
        if (!r.ok) {
          router.replace("/login");
          return;
        }
        const data = await r.json();
        setPlanLabel(data.user.access || data.user.plan);
        setAccess(data.access);
        setReady(true);
        if (!data.access?.allowed) {
          router.replace("/unlock");
          return;
        }
        if (data.access?.trialStarted && data.access.allowed) {
          timer = setInterval(() => {
            setAccess((prev) => {
              if (!prev || !prev.trialStarted) return prev;
              const remainingMs = Math.max(0, prev.remainingMs - 1000);
              if (remainingMs <= 0) {
                router.replace("/unlock");
              }
              return {
                ...prev,
                remainingMs,
                remainingLabel: formatRemaining(remainingMs),
                allowed: remainingMs > 0,
              };
            });
          }, 1000);
        }
      })
      .catch(() => router.replace("/login"));
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--ink-soft)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {access?.trialStarted && access.allowed ? (
        <div className="bg-[var(--ink)] px-5 py-2 text-center text-sm text-[#f8f4ec]">
          Pilot trial ends in <strong className="tabular-nums">{access.remainingLabel}</strong>
        </div>
      ) : null}
      <header className="border-b border-[var(--line)] bg-[rgba(250,248,243,0.85)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="display text-xl font-semibold">
              Pathly
            </Link>
            <nav className="hidden gap-4 text-sm font-medium md:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={pathname === l.href ? "opacity-100" : "opacity-75 hover:opacity-100"}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-[var(--sand-2)] px-3 py-1 font-medium capitalize">
              {planLabel}
            </span>
            <Link href="/feedback" className="btn btn-ghost px-3 py-1.5 text-xs">
              Feedback
            </Link>
            <Link href="/unlock" className="btn btn-ghost px-3 py-1.5 text-xs">
              Trial
            </Link>
            <button
              className="btn btn-ghost px-3 py-1.5 text-xs"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/");
                router.refresh();
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="display text-3xl font-semibold md:text-4xl">{title}</h1>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
