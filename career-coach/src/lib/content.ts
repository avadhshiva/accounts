export type Lesson = {
  slug: string;
  title: string;
  minutes: number;
  summary: string;
  body: string[];
  quiz: { q: string; options: string[]; answer: number }[];
};

export const TRACK = {
  slug: "genai-basics",
  title: "GenAI Basics for Campus to Corporate",
  description:
    "Practical GenAI skills Indian engineering freshers need for projects, internships, and interviews.",
  lessons: [
    {
      slug: "what-is-genai",
      title: "What GenAI Actually Is",
      minutes: 8,
      summary: "LLMs, prompts, and where GenAI helps (and fails) in real jobs.",
      body: [
        "Generative AI creates text, code, and images from patterns learned on large datasets.",
        "In campus-to-corporate work, GenAI is a co-pilot: drafts, explanations, test cases — not a replacement for judgment.",
        "Interview tip: say how you verified AI output (tests, docs, edge cases), not just that you used ChatGPT.",
      ],
      quiz: [
        {
          q: "Best description of GenAI at work?",
          options: [
            "It always gives correct answers",
            "A co-pilot that needs human verification",
            "Only useful for artists",
            "Illegal in interviews",
          ],
          answer: 1,
        },
      ],
    },
    {
      slug: "prompting-that-works",
      title: "Prompting That Works",
      minutes: 10,
      summary: "Role, context, constraints, and examples — the 4-part prompt pattern.",
      body: [
        "Strong prompts include: role, context, task, constraints, and output format.",
        "Example: “You are a hiring manager for a Java fresher role. Critique this project bullet for impact and metrics.”",
        "Iterate: ask for 3 versions, then pick and refine — don’t accept the first draft.",
      ],
      quiz: [
        {
          q: "Which prompt element improves consistency most?",
          options: ["Emojis", "Output format + constraints", "All caps", "Shorter prompts only"],
          answer: 1,
        },
      ],
    },
    {
      slug: "build-with-ai",
      title: "Build a Tiny App With AI",
      minutes: 12,
      summary: "Use AI to scaffold a mini project you can defend in interviews.",
      body: [
        "Pick a narrow problem: expense splitter, quiz app, or WhatsApp reminder checklist.",
        "Ask AI for architecture first, then implement yourself, then use AI for boilerplate.",
        "Document: problem → approach → what AI helped → what you changed → demo link/screenshots.",
      ],
      quiz: [
        {
          q: "What should you emphasize in interviews about AI-built projects?",
          options: [
            "That AI wrote everything",
            "Your decisions, testing, and ownership",
            "Model names only",
            "Token counts",
          ],
          answer: 1,
        },
      ],
    },
    {
      slug: "genai-interviews",
      title: "GenAI Interview Questions",
      minutes: 10,
      summary: "Hallucinations, RAG, temperature, ethics — fresher-ready answers.",
      body: [
        "Hallucination: model invents facts confidently — mitigate with retrieval, citations, and tests.",
        "Temperature: higher = more creative/varied; lower = more deterministic.",
        "Ethics: never paste confidential company or personal data into public tools without policy approval.",
      ],
      quiz: [
        {
          q: "A model invents a library that doesn’t exist. This is:",
          options: ["Fine-tuning", "Hallucination", "Embedding", "Quantization"],
          answer: 1,
        },
      ],
    },
  ] as Lesson[],
};

export function getLesson(slug: string) {
  return TRACK.lessons.find((l) => l.slug === slug) || null;
}
