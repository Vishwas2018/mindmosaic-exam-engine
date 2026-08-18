import { publishedExamBank } from "@/content/questions/practice-bank";
const cells = new Map<string, number>();
for (const q of publishedExamBank) {
  const key = `${q.examStyle}|${q.yearLevel}|${q.metadata.subject}`;
  cells.set(key, (cells.get(key) ?? 0) + 1);
}
const icasNumeracy = [...cells.entries()].filter(([k]) => k.startsWith("icas_style|") && k.endsWith("|numeracy"));
console.log(icasNumeracy.sort());
