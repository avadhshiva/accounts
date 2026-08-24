import type { InterviewIntent } from "./intent";

/**
 * Setup-screen CTA contract (Change 13 hotfix):
 * The button the student clicks decides the intent — prior card selection
 * must not leave the opposite CTA silently inert.
 */
export function setupStartIntent(
  clicked: "start-practice" | "start-assess",
): InterviewIntent {
  return clicked === "start-practice" ? "practice" : "assess";
}

/** Practice CTA must remain actionable even when Assess Mode card is selected. */
export function isSetupPracticeCtaEnabled(loading: boolean): boolean {
  return !loading;
}

/** Assess CTA disabled when loading or category assessment quota is exhausted. */
export function isSetupAssessCtaEnabled(loading: boolean, canStartAssessment = true): boolean {
  return !loading && canStartAssessment;
}
