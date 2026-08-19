import type {
  ReadinessAction,
  ReadinessCategory,
  ReadinessCategoryId,
  ReadinessComputeInput,
  ReadinessSnapshot,
} from "./types";

const CATEGORY_LABELS: Record<ReadinessCategoryId, string> = {
  resume: "Resume",
  hr: "HR mock",
  technical: "Technical mock",
  genai: "GenAI mock",
  aptitude: "Aptitude mock",
  learn: "Learn progress",
};

const INTERVIEW_MODES: Array<"hr" | "technical" | "genai" | "aptitude"> = [
  "hr",
  "technical",
  "genai",
  "aptitude",
];

const CATEGORY_HREF: Record<ReadinessCategoryId, string> = {
  resume: "/resume",
  hr: "/interview",
  technical: "/interview",
  genai: "/interview",
  aptitude: "/interview",
  learn: "/learn",
};

function latestByCreatedAt<T extends { createdAt: string }>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
}

function nonEmptyStrings(values: string[], max = 3): string[] {
  return values.map((s) => s.trim()).filter(Boolean).slice(0, max);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildResumeCategory(
  latestResume: ReadinessComputeInput["resumes"][number] | undefined,
): ReadinessCategory {
  if (!latestResume) {
    return {
      id: "resume",
      label: CATEGORY_LABELS.resume,
      status: "insufficient_data",
    };
  }
  return {
    id: "resume",
    label: CATEGORY_LABELS.resume,
    status: "complete",
    score: clampScore(latestResume.score),
    source: "latest_resume",
    assessedAt: latestResume.createdAt,
  };
}

function buildInterviewCategory(
  id: ReadinessCategoryId,
  mode: "hr" | "technical" | "genai" | "aptitude",
  interviews: ReadinessComputeInput["interviews"],
): ReadinessCategory {
  const completedWithScorecard = interviews.filter(
    (i) => i.mode === mode && i.status === "completed" && i.scorecard,
  );
  const latest = latestByCreatedAt(completedWithScorecard);
  if (!latest?.scorecard) {
    return {
      id,
      label: CATEGORY_LABELS[id],
      status: "insufficient_data",
    };
  }
  return {
    id,
    label: CATEGORY_LABELS[id],
    status: "complete",
    score: clampScore(latest.scorecard.overall),
    source: `interview:${mode}`,
    assessedAt: latest.createdAt,
  };
}

function collectGaps(
  latestResume: ReadinessComputeInput["resumes"][number] | undefined,
  interviews: ReadinessComputeInput["interviews"],
  completedCategories: ReadinessCategory[],
): string[] {
  const gaps: string[] = [];

  if (latestResume) {
    gaps.push(...nonEmptyStrings(latestResume.gaps, 3));
  }

  if (gaps.length < 3) {
    for (const mode of INTERVIEW_MODES) {
      const completed = interviews.filter(
        (i) => i.mode === mode && i.status === "completed" && i.scorecard,
      );
      const latest = latestByCreatedAt(completed);
      if (latest?.scorecard?.improvements) {
        for (const item of latest.scorecard.improvements) {
          if (gaps.length >= 3) break;
          const trimmed = item.trim();
          if (trimmed && !gaps.includes(trimmed)) gaps.push(trimmed);
        }
      }
    }
  }

  if (gaps.length < 3) {
    for (const category of completedCategories) {
      if (category.status === "complete" && category.score !== undefined && category.score < 70) {
        const label = `${category.label} below 70 (${category.score}/100)`;
        if (!gaps.includes(label)) {
          gaps.push(label);
          if (gaps.length >= 3) break;
        }
      }
    }
  }

  return gaps.slice(0, 3);
}

function hasCompletedInterview(interviews: ReadinessComputeInput["interviews"]): boolean {
  return interviews.some((i) => i.status === "completed" && i.scorecard);
}

function buildNextActions(
  latestResume: ReadinessComputeInput["resumes"][number] | undefined,
  interviews: ReadinessComputeInput["interviews"],
  completedCategories: ReadinessCategory[],
): ReadinessAction[] {
  const actions: ReadinessAction[] = [];

  if (!latestResume) {
    actions.push({
      label: "Score your resume",
      href: "/resume",
      categoryId: "resume",
    });
  }

  const scoredComplete = completedCategories.filter(
    (c) => c.status === "complete" && typeof c.score === "number",
  );
  if (scoredComplete.length > 0) {
    const weakest = [...scoredComplete].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];
    if (weakest.score !== undefined && weakest.score < 70) {
      actions.push({
        label: `Improve ${weakest.label.toLowerCase()} (score below 70)`,
        href: CATEGORY_HREF[weakest.id],
        categoryId: weakest.id,
      });
    }
  }

  if (!hasCompletedInterview(interviews)) {
    actions.push({
      label: "Complete a mock interview",
      href: "/interview",
      categoryId: "hr",
    });
  }

  if (actions.length < 4) {
    actions.push({
      label: "Explore a lesson",
      href: "/learn",
      categoryId: "learn",
    });
  }

  const aptitudeComplete = completedCategories.find(
    (c) => c.id === "aptitude" && c.status === "complete",
  );
  if (!aptitudeComplete && actions.length < 4) {
    actions.push({
      label: "Try aptitude drill",
      href: "/practice",
      categoryId: "aptitude",
    });
  }

  return actions.slice(0, 4);
}

export function computeReadiness(input: ReadinessComputeInput, now = new Date()): ReadinessSnapshot {
  const latestResume = latestByCreatedAt(input.resumes);

  const categories: ReadinessCategory[] = [
    buildResumeCategory(latestResume),
    buildInterviewCategory("hr", "hr", input.interviews),
    buildInterviewCategory("technical", "technical", input.interviews),
    buildInterviewCategory("genai", "genai", input.interviews),
    buildInterviewCategory("aptitude", "aptitude", input.interviews),
    {
      id: "learn",
      label: CATEGORY_LABELS.learn,
      status: "insufficient_data",
    },
  ];

  const scoredCategories = categories.filter(
    (c) => c.status === "complete" && typeof c.score === "number",
  );
  const completedCategoryCount = scoredCategories.length;

  let overall: number | undefined;
  let overallStatus: ReadinessSnapshot["overallStatus"] = "insufficient_data";
  if (completedCategoryCount > 0) {
    const mean =
      scoredCategories.reduce((sum, c) => sum + (c.score ?? 0), 0) / completedCategoryCount;
    overall = clampScore(mean);
    overallStatus = "complete";
  }

  const strengths = latestResume ? nonEmptyStrings(latestResume.strengths, 3) : [];

  const gaps = collectGaps(latestResume, input.interviews, categories);

  const nextActions = buildNextActions(latestResume, input.interviews, categories);

  return {
    computedAt: now.toISOString(),
    overall,
    overallStatus,
    completedCategoryCount,
    categories,
    strengths,
    gaps,
    nextActions,
  };
}
