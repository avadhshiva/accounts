import { getSessionUser } from "@/lib/auth";
import { defaultResumeTargetRole } from "@/lib/resume/defaultTargetRole";
import ResumeClient from "./ResumeClient";

export default async function ResumePage() {
  const user = await getSessionUser();
  // Unauthenticated visitors still get the client shell, which redirects to /login
  // (existing AppShellClient behavior). Fallback role is used until redirect.
  const initialRole = defaultResumeTargetRole(user?.targetRole);
  return <ResumeClient initialRole={initialRole} />;
}
