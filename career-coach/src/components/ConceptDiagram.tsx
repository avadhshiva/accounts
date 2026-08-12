import type { DiagramId } from "@/lib/lessonMeta";

export function ConceptDiagram({ id }: { id: DiagramId }) {
  switch (id) {
    case "llm-pipeline":
      return (
        <DiagramFrame title="How an LLM answers">
          <Flow
            steps={["Your prompt", "Tokenize", "Predict next tokens", "Reply", "You verify"]}
          />
          <p className="mt-3 text-xs text-[var(--ink-soft)]">
            Prediction ≠ guaranteed truth — always check critical output.
          </p>
        </DiagramFrame>
      );
    case "prompt-parts":
      return (
        <DiagramFrame title="Prompt building blocks">
          <div className="grid gap-2 sm:grid-cols-5">
            {["Role", "Context", "Task", "Constraints", "Format"].map((s, i) => (
              <Chip key={s} n={i + 1} label={s} />
            ))}
          </div>
        </DiagramFrame>
      );
    case "rag-flow":
      return (
        <DiagramFrame title="RAG in one glance">
          <Flow steps={["Question", "Search docs", "Top chunks", "Ask LLM + context", "Answer + sources"]} />
        </DiagramFrame>
      );
    case "ai-copilot":
      return (
        <DiagramFrame title="You + AI ownership">
          <div className="grid gap-3 sm:grid-cols-2">
            <Box title="You own" items={["Requirements", "Architecture", "Tests", "Final judgment"]} />
            <Box title="AI can draft" items={["Boilerplate", "Explanations", "Test stubs", "SQL drafts"]} />
          </div>
        </DiagramFrame>
      );
    case "dsa-loop":
      return (
        <DiagramFrame title="Interview problem loop">
          <Flow
            steps={["Clarify", "Example", "Brute force", "Optimize", "Complexity", "Code + test"]}
          />
        </DiagramFrame>
      );
    case "hash-map":
      return (
        <DiagramFrame title="Hash map intuition">
          <svg viewBox="0 0 520 160" className="h-auto w-full" role="img" aria-label="Hash map buckets">
            <rect x="10" y="40" width="90" height="50" rx="10" fill="#0f766e22" stroke="#0f766e" />
            <text x="55" y="70" textAnchor="middle" fontSize="14" fill="#0f1c2e">
              key
            </text>
            <path d="M110 65 H170" stroke="#0f1c2e" strokeWidth="2" markerEnd="url(#arrow)" />
            <text x="140" y="55" textAnchor="middle" fontSize="11" fill="#243447">
              hash
            </text>
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <rect
                  x={190}
                  y={20 + i * 32}
                  width="140"
                  height="26"
                  rx="6"
                  fill="#fffdf9"
                  stroke="#0f1c2e33"
                />
                <text x="260" y={38 + i * 32} textAnchor="middle" fontSize="12" fill="#243447">
                  bucket {i}
                  {i === 1 ? " → value" : ""}
                </text>
              </g>
            ))}
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#0f1c2e" />
              </marker>
            </defs>
          </svg>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            Average lookup ~O(1) — great for frequency counts & Two Sum.
          </p>
        </DiagramFrame>
      );
    case "oop-boxes":
      return (
        <DiagramFrame title="OOP at a glance">
          <div className="grid gap-3 sm:grid-cols-3">
            <Box title="Encapsulation" items={["Hide fields", "Expose methods"]} />
            <Box title="Inheritance" items={["Is-a reuse", "Shared behavior"]} />
            <Box title="Polymorphism" items={["Same interface", "Different impl"]} />
          </div>
        </DiagramFrame>
      );
    case "sql-join":
      return (
        <DiagramFrame title="INNER vs LEFT join">
          <div className="grid gap-3 sm:grid-cols-2">
            <Box title="INNER JOIN" items={["Only matching rows", "A ∩ B"]} />
            <Box title="LEFT JOIN" items={["All left rows", "Matches + nulls"]} />
          </div>
        </DiagramFrame>
      );
    case "os-process":
      return (
        <DiagramFrame title="Process vs thread">
          <div className="grid gap-3 sm:grid-cols-2">
            <Box title="Process" items={["Own memory", "Heavier isolate"]} />
            <Box title="Threads" items={["Share memory", "Lighter concurrency"]} />
          </div>
        </DiagramFrame>
      );
    case "project-story":
      return (
        <DiagramFrame title="Project pitch spine">
          <Flow steps={["Problem", "Users", "Your role", "Stack", "Hardest bug", "Metric"]} />
        </DiagramFrame>
      );
    case "percent-change":
      return (
        <DiagramFrame title="Successive % changes">
          <Flow steps={["Start 100", "×1.20 (+20%)", "×0.80 (−20%)", "= 96 (−4%)"]} />
        </DiagramFrame>
      );
    case "work-rate":
      return (
        <DiagramFrame title="Work-rate method">
          <Flow steps={["A: 1/a per day", "B: 1/b per day", "Together: 1/a+1/b", "Days = 1 / total"]} />
        </DiagramFrame>
      );
    case "number-series":
      return (
        <DiagramFrame title="Series pattern hunt">
          <Flow steps={["Write terms", "Diff / ratio", "Spot rule", "Predict next"]} />
        </DiagramFrame>
      );
    case "test-strategy":
      return (
        <DiagramFrame title="Timed test passes">
          <Flow steps={["Easy first", "Mark medium", "Skip sinks", "Review marked"]} />
        </DiagramFrame>
      );
    default:
      return null;
  }
}

function DiagramFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--line)] bg-[linear-gradient(180deg,#fffdf8,#f3faf8)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Flow({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--ink)] px-3 py-1.5 text-xs font-semibold text-[#f8f4ec]">
            {step}
          </span>
          {i < steps.length - 1 ? <span className="text-[var(--ink-soft)]">→</span> : null}
        </div>
      ))}
    </div>
  );
}

function Chip({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white/80 px-3 py-3 text-center">
      <p className="text-[10px] font-semibold text-[var(--accent)]">STEP {n}</p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
    </div>
  );
}

function Box({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white/80 p-3">
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 space-y-1 text-xs text-[var(--ink-soft)]">
        {items.map((i) => (
          <li key={i}>• {i}</li>
        ))}
      </ul>
    </div>
  );
}
