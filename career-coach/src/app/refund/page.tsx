import Link from "next/link";
import { APP_NAME } from "@/lib/brand";

export default function RefundPage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 py-10">
      <Link href="/" className="display text-2xl font-semibold">
        {APP_NAME}
      </Link>
      <h1 className="display mt-8 text-4xl font-semibold">Refund Policy</h1>
      <div className="mt-6 space-y-4 text-[var(--ink-soft)]">
        <p>
          During the free test pilot, {APP_NAME} does not charge money. When paid plans launch, first-time
          subscribers may request a refund within 7 days if AI features were unused, unless otherwise stated at
          checkout.
        </p>
        <p>
          Semester/annual plans are generally non-refundable after the trial window. Chargebacks should be a
          last resort — contact support first.
        </p>
      </div>
    </div>
  );
}
