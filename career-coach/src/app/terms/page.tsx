import Link from "next/link";

function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 py-10">
      <Link href="/" className="display text-2xl font-semibold">
        Pathly
      </Link>
      <h1 className="display mt-8 text-4xl font-semibold">{title}</h1>
      <div className="prose mt-6 space-y-4 text-[var(--ink-soft)]">{children}</div>
      <p className="mt-10 text-xs opacity-70">
        Template for test launch — have a CA/lawyer review before paid public launch.
      </p>
    </div>
  );
}

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p>
        Pathly provides AI-assisted career practice tools (resume feedback, mock interviews, and learning
        content). It is a practice product, not a recruiter, employer, or placement agency.
      </p>
      <p>
        We do not guarantee interviews, jobs, or exam results. AI outputs may be incomplete or incorrect —
        always review before using them in applications.
      </p>
      <p>
        You must be 18+ or have guardian permission. Do not upload confidential employer data or other
        people&apos;s personal information without rights to do so.
      </p>
      <p>
        Accounts may be suspended for abuse. Subscription billing will be described on the pricing page when
        payments go live. Governing law: India.
      </p>
    </LegalLayout>
  );
}
