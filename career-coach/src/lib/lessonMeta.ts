export type DiagramId =
  | "llm-pipeline"
  | "prompt-parts"
  | "rag-flow"
  | "ai-copilot"
  | "dsa-loop"
  | "hash-map"
  | "oop-boxes"
  | "sql-join"
  | "os-process"
  | "project-story"
  | "percent-change"
  | "work-rate"
  | "number-series"
  | "test-strategy";

export type LessonMeta = {
  checklist: string[];
  example?: string;
  diagram?: DiagramId;
};

/** Visual + checklist enrichment layered on top of TRACKS lessons */
export const LESSON_META: Record<string, LessonMeta> = {
  "what-is-genai": {
    diagram: "llm-pipeline",
    checklist: [
      "Explain LLM as next-token prediction in one sentence",
      "Name 2 failure modes (hallucination, stale knowledge)",
      "Say how you would verify AI output at work",
    ],
    example:
      "Bad: “ChatGPT wrote my auth.” Better: “I used AI for boilerplate, then wrote tests for login edge cases myself.”",
  },
  "prompting-that-works": {
    diagram: "prompt-parts",
    checklist: [
      "Write a prompt with Role + Context + Task + Constraints + Format",
      "Ask for 3 variants, then refine one",
      "Add complexity / edge-case ask for code prompts",
    ],
    example:
      "“You are a Java interviewer. Critique this fresher bullet. Max 2 lines. Add one metric suggestion.”",
  },
  "build-with-ai": {
    diagram: "ai-copilot",
    checklist: [
      "Pick a narrow project idea",
      "List what you own vs what AI drafts",
      "Prepare a 60-sec project pitch with one metric",
    ],
  },
  "rag-and-tools": {
    diagram: "rag-flow",
    checklist: [
      "Define RAG in plain English",
      "Sketch query → retrieve → prompt → answer",
      "Explain why RAG reduces hallucinations",
    ],
  },
  "genai-interviews": {
    diagram: "llm-pipeline",
    checklist: [
      "Answer hallucination with mitigation",
      "Explain temperature simply",
      "Give one ethics/data safety point",
    ],
  },
  "genai-at-work": {
    diagram: "ai-copilot",
    checklist: [
      "List 3 safe workplace uses",
      "List 2 unsafe uses",
      "Describe AI output as a PR to review",
    ],
  },
  "dsa-mindset": {
    diagram: "dsa-loop",
    checklist: [
      "Recite clarify → brute → optimize → complexity → test",
      "Give Big-O for array scan and hash lookup",
      "Explain when hashing beats nested loops",
    ],
  },
  "arrays-strings-hashing": {
    diagram: "hash-map",
    checklist: [
      "Explain anagram check with frequency map",
      "Describe Two Sum hash approach",
      "Name one sliding-window use case",
    ],
    example: "Two Sum: store needed complement in a map while scanning once → O(n).",
  },
  "oop-solid-basics": {
    diagram: "oop-boxes",
    checklist: [
      "Define encapsulation with an example",
      "Contrast inheritance vs composition",
      "Map 2 classes from your project",
    ],
  },
  "dbms-sql-essentials": {
    diagram: "sql-join",
    checklist: [
      "Primary key vs foreign key",
      "INNER vs LEFT join in one line each",
      "Index trade-off (read vs write)",
    ],
  },
  "os-networks-lite": {
    diagram: "os-process",
    checklist: [
      "Process vs thread",
      "Name HTTP 200/401/500 meanings",
      "Outline DNS → TCP → HTTP at fresher level",
    ],
  },
  "explain-your-project": {
    diagram: "project-story",
    checklist: [
      "60–90s project story ready",
      "One metric prepared",
      "One deep-dive topic ready (auth/DB/API)",
    ],
  },
  "quant-speed-math": {
    diagram: "percent-change",
    checklist: [
      "Compute successive % change correctly",
      "Convert ratio part to actual value",
      "Estimate before exact calc",
    ],
    example: "+20% then −20% → ×1.2 ×0.8 = 0.96 → 4% lower.",
  },
  "time-work-speed": {
    diagram: "work-rate",
    checklist: [
      "Convert days-to-finish into rate 1/a",
      "Add rates for together-work",
      "Convert km/h ↔ m/s",
    ],
  },
  "logical-puzzles": {
    diagram: "number-series",
    checklist: [
      "Check difference pattern first on series",
      "Fix one person in seating puzzles",
      "Watch for words like only/all/some",
    ],
  },
  "verbal-reasoning": {
    diagram: "test-strategy",
    checklist: [
      "State the analogy relationship before options",
      "Find the rule for odd-one-out",
      "Avoid extreme RC options without evidence",
    ],
  },
  "aptitude-test-strategy": {
    diagram: "test-strategy",
    checklist: [
      "Easy-first pass plan",
      "Know if negative marking applies",
      "Weekly 20-question drill habit",
    ],
  },
};
