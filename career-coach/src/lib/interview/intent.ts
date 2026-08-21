export type InterviewIntent = "practice" | "assess";

/** Additive intent parsing. Invalid / missing → null (UI may default). */
export function parseInterviewIntentParam(
  value: string | null | undefined,
): InterviewIntent | null {
  if (value === "practice" || value === "assess") return value;
  return null;
}

export function isInterviewIntent(value: string): value is InterviewIntent {
  return value === "practice" || value === "assess";
}
