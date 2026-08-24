import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, destroySession } from "@/lib/auth";
import { APP_NAME } from "@/lib/brand";
import { getAccessSnapshot } from "@/lib/access";
import {
  countTotalMockSessionsUsed,
  getTotalMockSessionsLimit,
} from "@/lib/assessmentQuota";
import { interviewRepo } from "@/lib/db";
import { formatNavUsagePill } from "@/lib/display";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/resume", label: "Resume" },
  { href: "/interview", label: "Interview" },
  { href: "/learn", label: "Learn" },
  { href: "/practice", label: "Aptitude" },
];

async function logoutAction() {
  "use server";
  await destroySession();
  redirect("/");
}

export async function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const access = getAccessSnapshot(user);
  if (!access.allowed) redirect("/unlock");

  const interviews = await interviewRepo.listByUserId(user.id, 100);
  const mockSessions = {
    used: countTotalMockSessionsUsed(interviews),
    total: getTotalMockSessionsLimit(user),
  };
  const usagePill = formatNavUsagePill(user, access.remainingLabel, mockSessions);

  return (
    <div className="min-h-screen">
      {access.access === "trial" && access.trialStarted ? (
        <div className="bg-[var(--ink)] px-5 py-2 text-center text-sm text-[#f8f4ec]">
          Pilot trial ends in <strong>{access.remainingLabel}</strong>
        </div>
      ) : null}
      <header className="border-b border-[var(--line)] bg-[rgba(250,248,243,0.85)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="display text-xl font-semibold">
              {APP_NAME}
            </Link>
            <nav className="hidden gap-4 text-sm font-medium md:flex">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="opacity-75 hover:opacity-100">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 text-sm md:gap-3">
            <Link
              href="/unlock"
              className="max-w-[11rem] truncate rounded-full bg-[var(--sand-2)] px-3 py-1 text-xs font-medium tabular-nums hover:opacity-90 md:max-w-none md:text-sm"
              title={usagePill}
            >
              {usagePill}
            </Link>
            <Link href="/feedback" className="btn btn-ghost px-3 py-1.5 text-xs">
              Feedback
            </Link>
            <form action={logoutAction}>
              <button className="btn btn-ghost px-3 py-1.5 text-xs" type="submit">
                Log out
              </button>
            </form>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="btn btn-ghost whitespace-nowrap px-3 py-1.5 text-xs"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="display text-3xl font-semibold md:text-4xl">{title}</h1>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
