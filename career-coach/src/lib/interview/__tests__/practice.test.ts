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

  it("assessment start route remains the only mockInterview increment path among interview APIs", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const root = path.join(process.cwd(), "src/app/api/interview");
    const startSrc = await fs.readFile(path.join(root, "start/route.ts"), "utf8");
    const replySrc = await fs.readFile(path.join(root, "reply/route.ts"), "utf8");
    expect(startSrc).toContain('incrementUsage(user.id, "mockInterviews")');
    expect(startSrc).toContain('canUse(user, "mockInterviews")');
    expect(replySrc).not.toContain("incrementUsage");
    // Practice must not add a start-like route that increments usage.
    const entries = await fs.readdir(root, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    expect(dirs).toEqual(expect.arrayContaining(["start", "reply"]));
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
    const onClickBlock = src.slice(Math.max(0, labelIdx - 320), labelIdx);
    expect(onClickBlock).toContain("beginPractice()");
    expect(onClickBlock).toContain('setIntent("practice")');
    expect(onClickBlock).not.toContain("/api/interview/start");
    expect(onClickBlock).not.toContain("beginAssess");
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
