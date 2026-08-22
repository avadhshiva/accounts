/** Fallback when the user has no usable profile targetRole. */
export const FALLBACK_RESUME_TARGET_ROLE = "SDE Fresher";

/**
 * Default/pre-fill value for Resume Studio target role.
 * Uses a non-empty trimmed profile targetRole; otherwise the safe fallback.
 */
export function defaultResumeTargetRole(targetRole?: string | null): string {
  const trimmed = typeof targetRole === "string" ? targetRole.trim() : "";
  return trimmed.length > 0 ? trimmed : FALLBACK_RESUME_TARGET_ROLE;
}
