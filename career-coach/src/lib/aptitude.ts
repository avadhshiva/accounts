export type AptitudeQuestion = {
  id: string;
  topic: "quant" | "logical" | "verbal";
  q: string;
  options: string[];
  answer: number;
  explain: string;
};

export const APTITUDE_BANK: AptitudeQuestion[] = [
  {
    id: "q1",
    topic: "quant",
    q: "A laptop price increases by 20% and then decreases by 20%. Compared to the original price, the final price is:",
    options: ["Same", "4% lower", "4% higher", "20% lower"],
    answer: 1,
    explain: "Multiply 1.2 × 0.8 = 0.96 → 4% lower.",
  },
  {
    id: "q2",
    topic: "quant",
    q: "A can finish work in 10 days, B in 15 days. Working together, they finish in:",
    options: ["12.5 days", "6 days", "25 days", "5 days"],
    answer: 1,
    explain: "Rates 1/10 + 1/15 = 1/6 → 6 days.",
  },
  {
    id: "q3",
    topic: "quant",
    q: "If the ratio of boys to girls is 3:2 and there are 30 boys, girls are:",
    options: ["15", "18", "20", "25"],
    answer: 2,
    explain: "3 parts = 30 → 1 part = 10 → girls = 20.",
  },
  {
    id: "q4",
    topic: "quant",
    q: "Average of 5 numbers is 20. If one number 30 is replaced by 10, new average is:",
    options: ["16", "18", "19", "22"],
    answer: 0,
    explain: "Sum was 100; replace 30 with 10 → sum 80 → avg 16.",
  },
  {
    id: "q5",
    topic: "logical",
    q: "Find the next number: 2, 6, 12, 20, 30, ?",
    options: ["36", "40", "42", "48"],
    answer: 2,
    explain: "Differences increase by +2 each time: +4,+6,+8,+10,+12.",
  },
  {
    id: "q6",
    topic: "logical",
    q: "Which is the odd one out? 3, 5, 7, 9, 11",
    options: ["3", "5", "9", "11"],
    answer: 2,
    explain: "9 is not prime; others are primes.",
  },
  {
    id: "q7",
    topic: "logical",
    q: "If all pens are pencils, and some pencils are erasers, which must be true?",
    options: [
      "All erasers are pens",
      "Some pens may be erasers",
      "No pencil is a pen",
      "All pencils are pens",
    ],
    answer: 1,
    explain: "Pens ⊂ pencils; pencils overlap erasers → pens may overlap erasers.",
  },
  {
    id: "q8",
    topic: "logical",
    q: "Complete: Cup : Coffee :: Bowl : ?",
    options: ["Dish", "Soup", "Spoon", "Plate"],
    answer: 1,
    explain: "Container : typical content.",
  },
  {
    id: "q9",
    topic: "verbal",
    q: "Choose the word closest in meaning to “candid”:",
    options: ["Secretive", "Frank", "Confused", "Rare"],
    answer: 1,
    explain: "Candid means frank / straightforward.",
  },
  {
    id: "q10",
    topic: "verbal",
    q: "Odd one out: Apple, Mango, Potato, Banana",
    options: ["Apple", "Mango", "Potato", "Banana"],
    answer: 2,
    explain: "Potato is a vegetable/tuber; others are fruits.",
  },
  {
    id: "q11",
    topic: "quant",
    q: "A train travels 120 km in 2 hours. Speed in m/s is:",
    options: ["16.67", "60", "30", "20"],
    answer: 0,
    explain: "60 km/h × 5/18 = 16.67 m/s.",
  },
  {
    id: "q12",
    topic: "quant",
    q: "Simple interest on ₹5000 at 10% per annum for 2 years is:",
    options: ["₹500", "₹1000", "₹1500", "₹2000"],
    answer: 1,
    explain: "SI = PRT/100 = 5000×10×2/100 = 1000.",
  },
];
