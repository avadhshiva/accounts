export type InterviewMode = "hr" | "genai" | "technical" | "aptitude";

export const INTERVIEW_MODES: {
  id: InterviewMode;
  label: string;
  blurb: string;
}[] = [
  {
    id: "hr",
    label: "HR Behavioural",
    blurb: "Tell me about yourself, teamwork, strengths, and fresher fit.",
  },
  {
    id: "genai",
    label: "GenAI Concepts",
    blurb: "LLMs, prompts, hallucinations, RAG — interview-ready answers.",
  },
  {
    id: "technical",
    label: "Technical / Coding",
    blurb: "DSA, OOP, DBMS, OS, projects — coding-round style questions.",
  },
  {
    id: "aptitude",
    label: "Aptitude & Reasoning",
    blurb: "Quantitative, logical puzzles, and verbal reasoning drills.",
  },
];

export type Lesson = {
  slug: string;
  title: string;
  minutes: number;
  summary: string;
  body: string[];
  quiz: { q: string; options: string[]; answer: number; explain?: string }[];
};

export type Track = {
  slug: string;
  title: string;
  tag: string;
  description: string;
  lessons: Lesson[];
};

export const TRACKS: Track[] = [
  {
    slug: "genai-campus-corporate",
    title: "GenAI for Campus → Corporate",
    tag: "GenAI",
    description:
      "Go beyond definitions: prompt patterns, project workflows, RAG basics, ethics, and how to talk about GenAI in interviews.",
    lessons: [
      {
        slug: "what-is-genai",
        title: "What GenAI Actually Is",
        minutes: 10,
        summary: "LLMs vs traditional software, tokens, and where GenAI fails at work.",
        body: [
          "Generative AI predicts likely next tokens — it is pattern completion, not guaranteed truth.",
          "In jobs, use it as a co-pilot: drafts, explanations, boilerplate, test cases. You still own correctness.",
          "Campus tip: interviewers care more about verification (tests, docs, edge cases) than which chatbot you used.",
          "Common failure modes: outdated facts, invented APIs, weak maths, and leaking private data if you paste secrets.",
        ],
        quiz: [
          {
            q: "Best workplace framing of GenAI?",
            options: [
              "It always gives correct answers",
              "A co-pilot that needs human verification",
              "Only useful for designers",
              "A replacement for coding interviews",
            ],
            answer: 1,
            explain: "Companies expect judgment + verification, not blind trust.",
          },
        ],
      },
      {
        slug: "prompting-that-works",
        title: "Prompting That Works",
        minutes: 12,
        summary: "Role, context, constraints, examples, and output format.",
        body: [
          "Strong prompt pattern: Role + Context + Task + Constraints + Output format.",
          "Example: “You are a hiring manager for a Java fresher. Rewrite this bullet with action verb + metric. Max 2 lines.”",
          "Iterate: ask for 3 options, critique, then refine. First draft is rarely final.",
          "For code: include language, inputs/outputs, constraints, and ask for complexity analysis.",
        ],
        quiz: [
          {
            q: "Which addition most improves consistency?",
            options: ["Emojis", "Output format + constraints", "ALL CAPS", "Shorter prompts only"],
            answer: 1,
          },
        ],
      },
      {
        slug: "build-with-ai",
        title: "Build a Tiny App With AI",
        minutes: 14,
        summary: "Scaffold a defendable mini-project for internships and interviews.",
        body: [
          "Pick a narrow problem: expense splitter, quiz app, campus lost-and-found, or WhatsApp reminder checklist.",
          "Workflow: clarify requirements → architecture → implement core yourself → use AI for boilerplate → test.",
          "Document for interviews: problem, your decisions, what AI generated, what you changed, demo screenshots.",
          "Add README, sample inputs, and at least 3 test cases so you can explain trade-offs.",
        ],
        quiz: [
          {
            q: "What should you emphasize about AI-assisted projects?",
            options: [
              "That AI wrote everything",
              "Your decisions, testing, and ownership",
              "Only model names",
              "Token counts",
            ],
            answer: 1,
          },
        ],
      },
      {
        slug: "rag-and-tools",
        title: "RAG, Tools & Simple Architecture",
        minutes: 12,
        summary: "Retrieval-Augmented Generation in fresher language.",
        body: [
          "RAG = fetch relevant documents first, then ask the model to answer using that context.",
          "Why it matters: reduces hallucinations for company FAQs, policies, and product docs.",
          "Simple pipeline: user query → search/embeddings → top chunks → prompt with chunks → answer + citations.",
          "Interview answer: “I’d ground the model with retrieved context and show sources, then still validate critical facts.”",
        ],
        quiz: [
          {
            q: "Main goal of RAG?",
            options: [
              "Make models larger",
              "Ground answers in retrieved context",
              "Remove the need for prompts",
              "Replace databases",
            ],
            answer: 1,
          },
        ],
      },
      {
        slug: "genai-interviews",
        title: "GenAI Interview Questions",
        minutes: 12,
        summary: "Hallucinations, temperature, ethics, and crisp answers.",
        body: [
          "Hallucination: confident invented facts — mitigate with retrieval, citations, evaluation, and human review.",
          "Temperature: higher = more varied/creative; lower = more deterministic for factual tasks.",
          "Ethics: never paste confidential company or personal data into public tools without policy approval.",
          "Practice answer structure: definition → example → risk → mitigation.",
        ],
        quiz: [
          {
            q: "A model invents a library that does not exist. This is:",
            options: ["Fine-tuning", "Hallucination", "Embedding", "Quantization"],
            answer: 1,
          },
        ],
      },
      {
        slug: "genai-at-work",
        title: "Using GenAI on the Job (Safely)",
        minutes: 10,
        summary: "What juniors actually use GenAI for in Indian IT teams.",
        body: [
          "Typical uses: understand legacy code, write unit tests, draft emails, summarize tickets, generate SQL drafts.",
          "Risky uses: copying proprietary code into public tools, accepting insecure snippets, skipping code review.",
          "Good habit: treat AI output like a junior teammate’s PR — review before merge.",
          "In appraisals/internships, show time saved + quality checks, not “I used ChatGPT”.",
        ],
        quiz: [
          {
            q: "Safest junior habit with GenAI code suggestions?",
            options: [
              "Paste production secrets for better answers",
              "Merge immediately to save time",
              "Review like a PR and add tests",
              "Disable all linting",
            ],
            answer: 2,
          },
        ],
      },
    ],
  },
  {
    slug: "coding-technical",
    title: "Coding & Technical Foundations",
    tag: "Technical",
    description:
      "DSA patterns, OOP, DBMS, OS, and how to explain projects in coding/technical rounds.",
    lessons: [
      {
        slug: "dsa-mindset",
        title: "DSA Mindset for Freshers",
        minutes: 14,
        summary: "Arrays, hashing, two pointers — how to think in interviews.",
        body: [
          "Interview pattern: clarify → examples → brute force → optimize → complexity → code → test.",
          "Hash maps unlock frequency counting, two-sum, anagrams, and many O(n) upgrades from O(n²).",
          "Two pointers help on sorted arrays / strings: pair sums, removing duplicates, palindrome checks.",
          "Always state time and space complexity. Interviewers listen for that signal.",
        ],
        quiz: [
          {
            q: "After clarifying a DSA problem, a strong next step is:",
            options: [
              "Jump to the most advanced algorithm",
              "Write brute force, then optimize",
              "Refuse to code without internet",
              "Only discuss Big-O with no approach",
            ],
            answer: 1,
          },
        ],
      },
      {
        slug: "arrays-strings-hashing",
        title: "Arrays, Strings & Hashing",
        minutes: 15,
        summary: "Core patterns asked in service + product company screens.",
        body: [
          "Must-practice: reverse/rotate array, max subarray intuition, move zeroes, merge intervals idea.",
          "Strings: frequency maps, anagram check, first unique character, basic sliding window.",
          "Explain trade-offs: sorting then scanning vs hashing for speed.",
          "When stuck: restate constraint (sorted? duplicates? memory limit?) — that often unlocks the pattern.",
        ],
        quiz: [
          {
            q: "Checking if two strings are anagrams is easiest with:",
            options: ["Binary search tree", "Frequency hash map / counting", "Dijkstra", "Recursion only"],
            answer: 1,
          },
        ],
      },
      {
        slug: "oop-solid-basics",
        title: "OOP & Clean Design Basics",
        minutes: 12,
        summary: "Classes, encapsulation, inheritance vs composition — fresher answers.",
        body: [
          "Encapsulation: hide internal state; expose clear methods.",
          "Inheritance vs composition: prefer composition when “has-a” fits better than “is-a”.",
          "Polymorphism: same interface, different implementations (e.g., Payment methods).",
          "Interview tip: map OOP to your project — User, Order, Service classes — not only textbook definitions.",
        ],
        quiz: [
          {
            q: "Hiding internal fields behind methods is mainly:",
            options: ["Polymorphism", "Encapsulation", "Indexing", "Normalization"],
            answer: 1,
          },
        ],
      },
      {
        slug: "dbms-sql-essentials",
        title: "DBMS & SQL Essentials",
        minutes: 14,
        summary: "Keys, joins, indexing, and transactions for campus interviews.",
        body: [
          "Primary key uniquely identifies a row; foreign key links tables.",
          "Joins: INNER (matches), LEFT (all left + matches), know when duplicates appear.",
          "Index speeds reads on selective columns but slows writes — say this trade-off.",
          "ACID in one line each: Atomicity, Consistency, Isolation, Durability — with a banking transfer example.",
        ],
        quiz: [
          {
            q: "An index typically:",
            options: [
              "Speeds selective reads, may slow writes",
              "Always speeds writes",
              "Removes the need for primary keys",
              "Makes joins illegal",
            ],
            answer: 0,
          },
        ],
      },
      {
        slug: "os-networks-lite",
        title: "OS & Networks (Interview Lite)",
        minutes: 12,
        summary: "Process vs thread, deadlock idea, HTTP basics.",
        body: [
          "Process = independent program instance; threads share memory inside a process.",
          "Deadlock needs circular wait — mention prevention ideas at a high level.",
          "HTTP request basics: method, URL, headers, body, status codes (200/400/401/500).",
          "What happens when you type a URL: DNS → TCP → TLS → HTTP → render (fresher-level is enough).",
        ],
        quiz: [
          {
            q: "Threads in the same process mainly share:",
            options: ["Nothing at all", "Memory space of the process", "Different OS kernels", "Separate IP addresses only"],
            answer: 1,
          },
        ],
      },
      {
        slug: "explain-your-project",
        title: "Explain Your Project Like an SDE",
        minutes: 12,
        summary: "Problem → architecture → your ownership → metrics → trade-offs.",
        body: [
          "Use a 60–90 second structure: problem, users, your role, tech stack, hardest bug, outcome.",
          "Add one metric even if approximate: users, time saved, accuracy, load time.",
          "Be ready for deep dives: auth, DB schema, API contracts, deployment.",
          "If AI helped: say what you generated vs what you designed and tested.",
        ],
        quiz: [
          {
            q: "Strong project answers usually include:",
            options: [
              "Only the tech stack list",
              "Problem, ownership, trade-offs, and outcome",
              "Professor’s name only",
              "All library versions",
            ],
            answer: 1,
          },
        ],
      },
    ],
  },
  {
    slug: "aptitude-reasoning",
    title: "Aptitude & Logical Reasoning",
    tag: "Aptitude",
    description:
      "Quantitative aptitude, logical puzzles, and verbal reasoning patterns used in campus drives.",
    lessons: [
      {
        slug: "quant-speed-math",
        title: "Quant Speed Maths",
        minutes: 12,
        summary: "Percentages, ratios, averages — fast methods.",
        body: [
          "Percent change: (new − old) / old × 100. Successive % changes are not simple addition.",
          "Ratio a:b means a/(a+b) share of total for a.",
          "Average = sum / count. If one value changes, adjust the sum, don’t restart blindly.",
          "Practice estimating before calculating to catch silly mistakes.",
        ],
        quiz: [
          {
            q: "A value rises 20% then falls 20%. Final vs original?",
            options: ["Same", "4% lower", "4% higher", "20% lower"],
            answer: 1,
            explain: "1.2 × 0.8 = 0.96 → 4% lower.",
          },
        ],
      },
      {
        slug: "time-work-speed",
        title: "Time, Work & Speed",
        minutes: 12,
        summary: "Work-rate and distance problems that appear in aptitude rounds.",
        body: [
          "Work: if A finishes in a days, rate = 1/a per day. Together rates add (when independent).",
          "Distance = speed × time. Keep units consistent (km/h vs m/s: ×5/18 or ×18/5).",
          "Pipes/cisterns: inflow positive, outflow negative rates.",
          "Draw a tiny table for multi-person work problems — reduces confusion.",
        ],
        quiz: [
          {
            q: "A does a job in 10 days, B in 15. Together they finish in:",
            options: ["12.5 days", "6 days", "25 days", "5 days"],
            answer: 1,
            explain: "1/10 + 1/15 = 1/6 → 6 days.",
          },
        ],
      },
      {
        slug: "logical-puzzles",
        title: "Logical Puzzles & Series",
        minutes: 12,
        summary: "Number series, seating, and deduction patterns.",
        body: [
          "Series: check +/− differences, ×/÷ patterns, alternating sequences.",
          "For seating/arrangement: fix one person, place constraints one by one, mark impossibles.",
          "Syllogisms: draw quick Venn sketches; don’t rely on English intuition alone.",
          "If two options seem possible, re-read the exact wording (“only”, “all”, “some”).",
        ],
        quiz: [
          {
            q: "Next in series: 2, 6, 12, 20, 30, ?",
            options: ["36", "40", "42", "48"],
            answer: 2,
            explain: "Gaps +4,+6,+8,+10,+12 → 30+12=42.",
          },
        ],
      },
      {
        slug: "verbal-reasoning",
        title: "Verbal Reasoning Basics",
        minutes: 10,
        summary: "Analogies, odd-one-out, and reading comprehension habits.",
        body: [
          "Analogies: map the relationship (part-whole, cause-effect, degree), not surface similarity.",
          "Odd-one-out: find the rule that groups 3 items, exclude the mismatch.",
          "RC tip: read question first for time-pressed tests, then scan for evidence.",
          "Avoid extreme answer choices unless the passage clearly supports them.",
        ],
        quiz: [
          {
            q: "Best first step in an analogy question?",
            options: [
              "Pick the longest word",
              "Define the relationship in the stem pair",
              "Ignore the stem pair",
              "Always choose synonyms",
            ],
            answer: 1,
          },
        ],
      },
      {
        slug: "aptitude-test-strategy",
        title: "Campus Aptitude Test Strategy",
        minutes: 10,
        summary: "Time management, skipping rules, and accuracy over ego.",
        body: [
          "First pass: solve easy questions fast; mark medium; skip time sinks.",
          "Guess only if there is no negative marking — know the company’s pattern.",
          "Keep rough work neat; most errors are arithmetic slips, not concepts.",
          "Weekly routine: 20 timed questions + review every wrong answer’s concept.",
        ],
        quiz: [
          {
            q: "Best opening strategy in a timed aptitude section?",
            options: [
              "Start with the hardest puzzle",
              "Clear easy questions first, then medium",
              "Spend 10 minutes on one question",
              "Leave all quant for the end always",
            ],
            answer: 1,
          },
        ],
      },
    ],
  },
];

export function getAllLessons() {
  return TRACKS.flatMap((t) => t.lessons.map((l) => ({ ...l, trackSlug: t.slug, trackTitle: t.title })));
}

export function getTrack(slug: string) {
  return TRACKS.find((t) => t.slug === slug) || null;
}

export function getLesson(slug: string) {
  for (const track of TRACKS) {
    const lesson = track.lessons.find((l) => l.slug === slug);
    if (lesson) return { lesson, track };
  }
  return null;
}

export function totalLessonCount() {
  return TRACKS.reduce((n, t) => n + t.lessons.length, 0);
}

/** @deprecated use TRACKS — kept as alias for older imports */
export const TRACK = TRACKS[0];
