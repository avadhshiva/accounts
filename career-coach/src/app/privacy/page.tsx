import Link from "next/link";
import { APP_NAME } from "@/lib/brand";

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 py-10">
      <Link href="/" className="display text-2xl font-semibold">
        {APP_NAME}
      </Link>
      <h1 className="display mt-8 text-4xl font-semibold">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-[var(--ink-soft)]">
        <p>
          We collect account details (name, email), optional college/role, resume text you paste, and interview
          practice messages to provide the service.
        </p>
        <p>
          If AI API keys are configured, resume/interview text may be sent to Gemini or OpenAI to generate
          feedback. Without keys, {APP_NAME} uses on-server mock coaching logic.
        </p>
        <p>
          Payment providers (when enabled) receive billing data. We use cookies/sessions to keep you logged in
          and basic analytics may be added later.
        </p>
        <p>
          You can request deletion of your account data by emailing the support address published on the site.
          Do not submit sensitive medical or financial data in resumes unless necessary.
        </p>
        <p>This MVP may store data in a local server database file during testing.</p>
      </div>
    </div>
  );
}
