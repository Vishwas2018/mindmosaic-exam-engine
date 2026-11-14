import type { Question } from "@/schemas/question.schema";

/** Pure planning only. Callers must supply the canonical server-gated bank.
 * This does not admit content, create sessions, accept client scores or persist attempts.
 */
export function selectPractice(
  approvedBank: readonly Question[], count: number,
  options: { subject?: string; weakTopics?: readonly string[]; random?: () => number } = {},
): Question[] {
  if (!Number.isInteger(count) || count<1) return [];
  const pool = approvedBank.filter(q=>q.status==="published" && q.examStyle==="scholarship_style" && q.id.startsWith("vihaan-") && (!options.subject || q.metadata.subject===options.subject) && (!options.weakTopics?.length || options.weakTopics.includes(q.metadata.topic)));
  const unique = [...new Map(pool.map(q=>[q.id,q])).values()];
  const random = options.random ?? Math.random;
  for (let i=unique.length-1;i>0;i--) {
    const r = random();
    if (!Number.isFinite(r) || r<0 || r>=1) throw new Error("Random source must return a value in [0,1)");
    const j = Math.floor(r*(i+1));
    [unique[i],unique[j]]=[unique[j],unique[i]];
  }
  return unique.slice(0,count);
}

/** An adapter contract for server-verified persisted attempts, never browser input. */
export interface RecordedOutcome {
  responseId: string;
  questionId: string;
  topic: string;
  subject: string;
  submittedAt: string;
  elapsedSeconds: number;
  status: "correct" | "incorrect" | "unanswered" | "pending_manual_review";
}
export function summariseProgress(outcomes: readonly RecordedOutcome[]) {
  const topics = new Map<string,{ subject:string; topic:string; attempted:number; correct:number; seconds:number; attempts:Set<string> }>();
  const seen = new Set<string>();
  let pendingWriting = 0;
  for (const row of outcomes) {
    if (seen.has(row.responseId) || !row.responseId || !row.questionId.startsWith("vihaan-") || !Number.isFinite(Date.parse(row.submittedAt)) || !Number.isFinite(row.elapsedSeconds) || row.elapsedSeconds<0) continue;
    seen.add(row.responseId);
    if (row.subject==="writing") {
      if (row.status==="pending_manual_review") pendingWriting++;
      // A reviewed essay has rubric feedback, never an objectively correct answer.
      continue;
    }
    if (row.status==="pending_manual_review") continue;
    if (row.status!=="correct" && row.status!=="incorrect") continue;
    const key = JSON.stringify([row.subject,row.topic]);
    const topic = topics.get(key) ?? {subject:row.subject,topic:row.topic,attempted:0,correct:0,seconds:0,attempts:new Set<string>()};
    topic.attempted++;
    if (row.status==="correct") topic.correct++;
    topic.seconds+=row.elapsedSeconds;
    topic.attempts.add(row.questionId);
    topics.set(key,topic);
  }
  const summaries = [...topics.values()].map(t=>({subject:t.subject,topic:t.topic,attempted:t.attempted,distinctQuestions:t.attempts.size,accuracyPercent:Math.round(100*t.correct/t.attempted),meanSeconds:t.seconds/t.attempted,sufficientEvidence:t.attempts.size>=5}));
  return { topics:summaries, pendingWriting, weakTopics:summaries.filter(t=>t.sufficientEvidence && t.accuracyPercent<70).sort((a,b)=>a.accuracyPercent-b.accuracyPercent).map(t=>t.topic) };
}
