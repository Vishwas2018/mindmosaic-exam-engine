import { publishedExamBank } from "@/content/questions/practice-bank";
const first5 = new Set(publishedExamBank.slice(0,5).map(q=>q.id));
const icas = publishedExamBank.filter(q=>q.examStyle==='icas_style'&&q.metadata.subject==='numeracy'&&!first5.has(q.id));
const naplan = publishedExamBank.filter(q=>q.examStyle==='naplan_style'&&q.metadata.subject==='numeracy'&&!first5.has(q.id));
console.log("icas count avail:", icas.length, icas[0]?.id);
console.log("naplan count avail:", naplan.length, naplan[0]?.id);
