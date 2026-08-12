import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, destroySession } from "@/lib/auth";
import { LIMITS } from "@/lib/limits";

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

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[rgba(250,248,243,0.85)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="display text-xl font-semibold">
              Pathly
            </Link>
            <nav className="hidden gap-4 text-sm font-medium md:flex">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="opacity-75 hover:opacity-100">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-[var(--sand-2)] px-3 py-1 font-medium capitalize">
              {user.plan} · {user.usage.resumeAnalyses}/{LIMITS[user.plan].resumeAnalyses} resumes
            </span>
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
