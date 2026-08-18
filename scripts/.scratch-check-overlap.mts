import { publishedExamBank } from "@/content/questions/practice-bank";
const first3 = publishedExamBank.slice(0,3).map(q=>q.id);
const icas = publishedExamBank.filter(q=>q.examStyle==='icas_style'&&q.metadata.subject==='numeracy').slice(0,1).map(q=>q.id);
const naplan = publishedExamBank.filter(q=>q.examStyle==='naplan_style'&&q.metadata.subject==='numeracy').slice(0,1).map(q=>q.id);
console.log("first3:", first3);
console.log("icas[0]:", icas);
console.log("naplan[0]:", naplan);
console.log("overlap:", first3.filter(id => icas.includes(id) || naplan.includes(id)));
