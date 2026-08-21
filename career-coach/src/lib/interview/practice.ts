import { getQuestionBank, pickQuestionSet } from "@/lib/interviewQuestions";
import type { InterviewMode } from "@/lib/types";

/** Static, mode-level coaching tips — no AI / no network. */
const MODE_HINTS: Record<InterviewMode, string[]> = {
  hr: [
    "Use a short STAR structure: Situation → Task → Action → Result.",
    "Keep the answer under ~60–90 seconds and end with what you want next.",
    "Name one concrete example from college, internship, or a project.",
  ],
  technical: [
    "Clarify constraints first, then outline brute force before optimizing.",
    "State time and space complexity out loud.",
    "Tie the concept back to something you built or debugged.",
  ],
  genai: [
    "Define the idea in one sentence, then give a campus/product example.",
    "Mention one failure mode (hallucination, stale data, privacy) and a mitigation.",
    "Prefer grounded answers (RAG / review) over “just trust the model”.",
  ],
  aptitude: [
    "Write the formula first, then substitute numbers.",
    "Check units (%, days, km/h ↔ m/s) before the final number.",
    "Estimate roughly — if the answer looks off, re-check the step you changed.",
  ],
};

export function pickPracticeQuestion(
  mode: InterviewMode,
  exclude: string[] = [],
): string {
  const bank = getQuestionBank(mode);
  const available = bank.filter((q) => !exclude.includes(q));
  const pool = available.length > 0 ? available : bank;
  // Reuse shuffle via pickQuestionSet on a temporary subset path:
  // pick a fresh random set from the full bank, then prefer one not excluded.
  const sampled = pickQuestionSet(mode, Math.min(5, bank.length));
  return sampled.find((q) => pool.includes(q)) ?? pool[Math.floor(Math.random() * pool.length)];
}

export function getPracticeHint(mode: InterviewMode, questionIndex = 0): string {
  const hints = MODE_HINTS[mode];
  return hints[questionIndex % hints.length];
}

export function listPracticeHints(mode: InterviewMode): string[] {
  return [...MODE_HINTS[mode]];
}
