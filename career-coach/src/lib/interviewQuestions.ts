import type { InterviewMode } from "./types";

const BANKS: Record<InterviewMode, string[]> = {
  hr: [
    "Tell me about yourself in 60 seconds, focused on your engineering background and what role you want.",
    "Describe a conflict in a team project and how you handled it.",
    "Why should we hire you as a fresher?",
    "What is a weakness you are actively improving, with one example?",
    "Tell me about a time you missed a deadline. What did you learn?",
    "Where do you see yourself in three years, realistically as a fresher?",
    "Describe a situation where you had to learn something new quickly for a project.",
    "Why this company and this role — what research have you done?",
    "How do you handle constructive criticism from a teammate or professor?",
    "Describe your most challenging academic or internship experience and your contribution.",
    "What motivates you beyond salary when choosing your first job?",
    "Tell me about a leadership moment, even in a small student club or fest team.",
  ],
  genai: [
    "In simple terms, what is an LLM and where can it fail in production?",
    "What is hallucination in GenAI, and how would you reduce it in an app?",
    "Explain prompt engineering with one example from a campus project.",
    "What is RAG, and when would you use it instead of a plain chatbot?",
    "What is the difference between fine-tuning and prompt engineering?",
    "How would you evaluate the quality of an AI-generated answer in a product?",
    "What are embeddings, and why do they matter in semantic search?",
    "Explain temperature in LLM APIs — when would you set it low vs high?",
    "What ethical risks should a fresher consider before shipping a GenAI feature?",
    "Describe one real use case where GenAI helped you in a project or assignment.",
    "What is token limit context window, and how does it affect app design?",
    "How would you prevent users from leaking sensitive data into a public LLM API?",
  ],
  technical: [
    "Explain a project on your resume: problem, your role, tech stack, hardest bug, and outcome.",
    "How does a hash map work, and when would you prefer it over an array? Give time complexity.",
    "Write the approach (not full code) for Two Sum. Start with brute force, then optimize.",
    "Explain PRIMARY KEY vs FOREIGN KEY, and when you would add an index.",
    "Process vs thread — what's the difference, and when would you use multithreading?",
    "Explain OOP pillars with one example from your project.",
    "What is REST? Design endpoints for a simple library book issue system.",
    "Binary search — when does it apply and what is its time complexity?",
    "Explain ACID properties in databases with a short example.",
    "What is the difference between stack and queue? Give one use case each.",
    "How does Git branching work? Explain merge vs rebase in one sentence each.",
    "What is Big-O notation? Compare O(n) vs O(n log n) with a sorting example.",
    "Explain how you would debug a 500 error in a web API you built.",
    "What is normalization in DBMS — why not store everything in one giant table?",
  ],
  aptitude: [
    "A price rises 25% and then falls 20%. Is the final price higher or lower than original, and by how much percent? Show steps.",
    "A finishes a job in 12 days, B in 18 days. How many days if they work together? Explain the rate method.",
    "Find the next number: 3, 6, 11, 18, 27, ? Explain the pattern.",
    "A train covers 90 km in 1.5 hours. What is the speed in m/s? Show the conversion.",
    "In a ratio of 5:3, if the larger part is 40, what is the smaller part?",
    "If 30% of a number is 45, what is the number?",
    "A shopkeeper gives 10% discount and still gains 20%. If CP is ₹200, find the marked price.",
    "Clock hands coincide how many times between 12 noon and midnight?",
    "Average of 5 numbers is 20. If one number is removed, average becomes 18. Find the removed number.",
    "A can do work in 10 days, B in 15 days. A works 4 days alone, then B joins. Days to finish?",
    "Simple interest on ₹5000 at 8% for 2 years — calculate and show formula.",
    "In how many ways can 3 students be chosen from 8 for a team?",
  ],
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Pick a random subset of questions for one mock interview session. */
export function pickQuestionSet(mode: InterviewMode, count = 5): string[] {
  const bank = BANKS[mode];
  return shuffle(bank).slice(0, Math.min(count, bank.length));
}

export function getQuestionBank(mode: InterviewMode): string[] {
  return BANKS[mode];
}
