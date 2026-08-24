import { describe, expect, it } from "vitest";
import { parseInterviewIntentParam, isInterviewIntent } from "../intent";
import {
  getPracticeHint,
  listPracticeHints,
  pickPracticeQuestion,
} from "../practice";
import { parseInterviewModeParam } from "../mode";
import { getQuestionBank } from "@/lib/interviewQuestions";

describe("parseInterviewIntentParam", () => {
  it("accepts practice and assess", () => {
    expect(parseInterviewIntentParam("practice")).toBe("practice");
    expect(parseInterviewIntentParam("assess")).toBe("assess");
  });

  it("returns null for missing or invalid values", () => {
    expect(parseInterviewIntentParam(null)).toBeNull();
    expect(parseInterviewIntentParam(undefined)).toBeNull();
    expect(parseInterviewIntentParam("")).toBeNull();
    expect(parseInterviewIntentParam("warmup")).toBeNull();
  });

  it("isInterviewIntent narrows valid intents only", () => {
    expect(isInterviewIntent("practice")).toBe(true);
    expect(isInterviewIntent("assess")).toBe(true);
    expect(isInterviewIntent("score")).toBe(false);
  });
});

describe("practice helpers", () => {
  it("picks questions from the existing bank for every mode", () => {
    for (const mode of ["hr", "technical", "genai", "aptitude"] as const) {
      const q = pickPracticeQuestion(mode);
      expect(getQuestionBank(mode)).toContain(q);
    }
  });

  it("prefers questions not in the exclude list when possible", () => {
    const mode = "hr";
    const bank = getQuestionBank(mode);
    const exclude = bank.slice(0, Math.max(1, bank.length - 1));
    const q = pickPracticeQuestion(mode, exclude);
    if (exclude.length < bank.length) {
      expect(exclude).not.toContain(q);
    }
    expect(bank).toContain(q);
  });

  it("returns static hints without network or scoring", () => {
    for (const mode of ["hr", "technical", "genai", "aptitude"] as const) {
      const hints = listPracticeHints(mode);
      expect(hints.length).toBeGreaterThan(0);
      expect(getPracticeHint(mode, 0)).toBe(hints[0]);
      expect(getPracticeHint(mode, hints.length)).toBe(hints[0]);
    }
  });

  it("Change 15: prefers Focus area text as hints when provided", () => {
    const focus = ["State time complexity", "Start with brute force"];
    expect(getPracticeHint("technical", 0, focus)).toBe("State time complexity");
    expect(getPracticeHint("technical", 1, focus)).toBe("Start with brute force");
    expect(getPracticeHint("technical", 2, focus)).toBe("State time complexity");
    // Empty / blank focus falls back to mode hints
    expect(getPracticeHint("technical", 0, [])).toBe(listPracticeHints("technical")[0]);
    expect(getPracticeHint("hr", 0, ["  "])).toBe(listPracticeHints("hr")[0]);
  });
});

describe("Change 7 mode parsing remains intact with intent", () => {
  it("still resolves each interview mode from query values", () => {
    expect(parseInterviewModeParam("hr")).toBe("hr");
    expect(parseInterviewModeParam("technical")).toBe("technical");
    expect(parseInterviewModeParam("genai")).toBe("genai");
    expect(parseInterviewModeParam("aptitude")).toBe("aptitude");
  });
});

describe("practice limit-safety contracts", () => {
  it("practice helpers do not import or call usage increment APIs", async () => {
    const practice = await import("../practice");
    expect(typeof practice.pickPracticeQuestion).toBe("function");
    expect(typeof practice.getPracticeHint).toBe("function");
    // No side-effectful exports — practice is pure/local.
    expect(Object.keys(practice).sort()).toEqual(
      ["getPracticeHint", "listPracticeHints", "pickPracticeQuestion"].sort(),
    );
  });

  it("assessment start route uses per-category quota (not global mock counter)", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const root = path.join(process.cwd(), "src/app/api/interview");
    const startSrc = await fs.readFile(path.join(root, "start/route.ts"), "utf8");
    const replySrc = await fs.readFile(path.join(root, "reply/route.ts"), "utf8");
    const focusSrc = await fs.readFile(path.join(root, "latest-focus/route.ts"), "utf8");
    const quotaSrc = await fs.readFile(path.join(root, "assessment-quota/route.ts"), "utf8");
    expect(startSrc).toContain("canStartAssessmentForMode");
    expect(startSrc).not.toContain("incrementUsage");
    expect(startSrc).not.toContain('canUse(user, "mockInterviews")');
    expect(quotaSrc).toContain("countAssessmentAttemptsForMode");
    expect(replySrc).not.toContain("incrementUsage");
    // Change 15 latest-focus is read-only — never creates sessions or burns mocks.
    expect(focusSrc).toContain("export async function GET");
    expect(focusSrc).not.toContain("incrementUsage");
    expect(focusSrc).not.toContain("interviewRepo.create");
    expect(focusSrc).toContain("latestCompletedImprovementsForMode");
    // Practice must not add a start-like route that increments usage.
    const entries = await fs.readdir(root, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    expect(dirs).toEqual(
      expect.arrayContaining(["start", "reply", "latest-focus", "assessment-quota"]),
    );
    expect(dirs).not.toContain("practice");
  });

  it("InterviewClient practice path does not call /api/interview/start", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const src = await fs.readFile(
      path.join(process.cwd(), "src/app/interview/InterviewClient.tsx"),
      "utf8",
    );
    // Assess start helper is the only fetch to start.
    const startFetches = [...src.matchAll(/fetch\(\s*["']\/api\/interview\/start["']/g)];
    expect(startFetches.length).toBe(1);
    expect(src).toContain("beginPractice");
    expect(src).toContain("PracticePanel");
    expect(src).toContain("HrWarmUp");
    // Practice phase mounts PracticePanel; startAssessment is only used from assess/warmup.
    expect(src).toMatch(/function beginPractice\(\) \{\s*setError\(""\);\s*setPhase\("practice"\);\s*\}/);
    expect(src).not.toMatch(
      /function beginPractice\(\) \{[^}]*\/api\/interview\/start/,
    );
  });

  it("Change 14 scorecard Practice this track uses beginPractice (no start API)", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const src = await fs.readFile(
      path.join(process.cwd(), "src/app/interview/InterviewClient.tsx"),
      "utf8",
    );
    expect(src).toContain("Practice this track");
    const labelIdx = src.indexOf("Practice this track");
    const onClickBlock = src.slice(Math.max(0, labelIdx - 520), labelIdx);
    expect(onClickBlock).toContain("beginPractice()");
    expect(onClickBlock).toContain('setIntent("practice")');
    expect(onClickBlock).not.toContain("/api/interview/start");
    expect(onClickBlock).not.toContain("beginAssess");
    // Change 15: carry scorecard improvements into Focus before clearing session.
    expect(onClickBlock).toContain("normalizeFocusAreas(session.scorecard?.improvements)");
    expect(onClickBlock).toContain("setFocusAreas(nextFocus)");
    expect(onClickBlock).toContain("setFocusForMode(session.mode)");
  });

  it("Change 15 PracticePanel receives focusAreas and deep-link can load latest-focus", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const clientSrc = await fs.readFile(
      path.join(process.cwd(), "src/app/interview/InterviewClient.tsx"),
      "utf8",
    );
    const panelSrc = await fs.readFile(
      path.join(process.cwd(), "src/components/interview/PracticePanel.tsx"),
      "utf8",
    );
    expect(clientSrc).toContain("focusAreas={focusAreas}");
    expect(clientSrc).toContain("/api/interview/latest-focus?mode=");
    expect(clientSrc).toMatch(/phase !== "practice"/);
    // Deep-link / setup Practice may fetch focus; must never use start for focus load.
    const focusFetchIdx = clientSrc.indexOf("/api/interview/latest-focus?mode=");
    expect(focusFetchIdx).toBeGreaterThan(-1);
    const focusFetchWindow = clientSrc.slice(
      Math.max(0, focusFetchIdx - 200),
      focusFetchIdx + 120,
    );
    expect(focusFetchWindow).not.toContain("/api/interview/start");
    expect(panelSrc).toContain("Focus areas");
    expect(panelSrc).toContain("hasPracticeFocus");
    expect(panelSrc).toContain("getPracticeHint(mode, hintIndex, normalizedFocus)");
  });

  it("Change 14 ?intent=practice auto-enters practice phase without assess start", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const src = await fs.readFile(
      path.join(process.cwd(), "src/app/interview/InterviewClient.tsx"),
      "utf8",
    );
    expect(src).toContain('intentFromUrl === "practice"');
    expect(src).toMatch(/intentFromUrl === "practice"[\s\S]*?setPhase\("practice"\)/);
    // Must not auto-start Assess from intent=assess.
    expect(src).not.toMatch(/intentFromUrl === "assess"[\s\S]{0,120}beginAssess/);
    expect(src).not.toMatch(/intentFromUrl === "assess"[\s\S]{0,120}startAssessment/);
  });

  it("HR warm-up is gated to hr + assess and both CTAs call startAssessment", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const src = await fs.readFile(
      path.join(process.cwd(), "src/app/interview/InterviewClient.tsx"),
      "utf8",
    );
    expect(src).toMatch(/if \(mode === "hr"\)[\s\S]*?setPhase\("hr-warmup"\)/);
    expect(src).toContain("onSkip={() => {\n            void startAssessment();");
    expect(src).toContain(
      "onContinueToAssessment={() => {\n            void startAssessment();",
    );
  });
});

describe("warm-up component contracts", () => {
  it("HrWarmUp is text-only with 60s timer and no media APIs", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const src = await fs.readFile(
      path.join(process.cwd(), "src/components/interview/HrWarmUp.tsx"),
      "utf8",
    );
    expect(src).toContain("WARMUP_SECONDS = 60");
    expect(src).toContain("Tell me about yourself.");
    expect(src).toContain("Skip Warm-Up");
    expect(src).toContain("Start HR Assessment");
    expect(src).not.toMatch(/getUserMedia|MediaRecorder|navigator\.mediaDevices/);
  });
});
