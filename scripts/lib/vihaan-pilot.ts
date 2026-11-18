import { createHash } from "node:crypto";
import { z } from "zod";
import { questionBaseSchema, questionSchema, type Question } from "../../src/schemas/question.schema";
import { skillTaxonomyRegistry } from "../../src/features/question-factory/taxonomy/registry";
import { scholarshipWrittenExpressionRubric } from "../../src/features/writing/rubrics/scholarship-written-expression";

export const TARGETS = { numeracy: 120, numerical_reasoning: 100, verbal_reasoning: 80, reading: 60, writing: 40 } as const;
const strictQuestion = questionBaseSchema.strict().extend({
  status: z.literal("draft"), yearLevel: z.literal(6), examStyle: z.literal("scholarship_style"),
  id: z.string().regex(/^vihaan-p01-(m0[1-6]|n0[1-5]|v0[1-4]|r0[1-3]|w0[1-2])$/),
  metadata: questionBaseSchema.shape.metadata.strict().extend({tags:z.array(z.enum(["vihaan-pilot","year-5-stretch","manual-assessment"]))}),
  options: z.array(z.object({ id: z.enum(["a", "b", "c", "d"]), text: z.string().min(1) }).strict()),
  answerKey: z.discriminatedUnion("kind", [
    z.object({kind:z.literal("single_option"),optionId:z.enum(["a","b","c","d"])}).strict(),
    z.object({kind:z.literal("manual"),rubric:z.string().min(10),sampleResponse:z.string().min(1).optional()}).strict(),
  ]),
  stimulus: z.object({title:z.string().min(1),body:z.string().min(1),attribution:z.literal("MindMosaic original")}).strict().optional(),
  visuals: z.array(z.never()).length(0), media: z.never().optional(), interaction: z.never().optional(),
}).superRefine((q, ctx) => {
  const result = questionSchema.safeParse(q);
  if (!result.success) for (const issue of result.error.issues) ctx.addIssue({ code: "custom", message: issue.message, path: issue.path });
  if (!["multiple_choice", "reading_comprehension", "essay"].includes(q.type)) ctx.addIssue({ code: "custom", message: "Unsupported pilot interaction" });
  if (q.metadata.locale !== "en-AU") ctx.addIssue({ code: "custom", message: "Australian English required" });
});
export const pilotSchema = z.object({
  batchId: z.literal("vihaan-pilot-01"), version: z.literal(1),
  provenance: z.object({ adapter: z.literal("manual_external"), author: z.string().min(1), model: z.null(), generatedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), originalGenerationEvidence: z.string().min(1), externalSourceMaterialUsed: z.literal(false), qwenStatus: z.string().min(1), promptFile: z.literal("authoring-brief.md") }).strict(),
  approvedBy: z.null(),
  items: z.array(z.object({
    question: strictQuestion,
    workedSolution: z.array(z.string().min(10)).min(2),
    reviewFocus: z.array(z.string().min(10)).min(1),
    writingGuidance: z.object({ rubricId: z.literal("scholarship-written-expression"), rubricVersion: z.literal(1), successCriteria: z.array(z.string().min(10)).min(3), assessmentMode: z.literal("human_only") }).strict().nullable(),
  }).strict()).length(20),
}).strict();
export type Pilot = z.infer<typeof pilotSchema>;
export const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const normalise = (s: string) => s.toLowerCase().normalize("NFKC").replace(/[^a-z0-9]+/g, " ").trim();
export function similarity(a: string, b: string): number {
  const tokens = (s: string) => new Set(normalise(s).split(" "));
  const x = tokens(a), y = tokens(b);
  return [...x].filter(t => y.has(t)).length / new Set([...x, ...y]).size;
}

// Every parser consumes the WHOLE stem. No answer, explanation, solver sidecar or
// candidate-supplied formula enters recomputation. Unrecognised wording fails closed.
type Solver = { pattern: RegExp; solve: (n: number[]) => number | string };
const solvers: Record<string, Solver> = {
  m01: { pattern: /^A club has (\d+) badges\. It gives away one quarter of them, then gives away two sevenths of the remaining badges\. How many badges are left\?$/, solve: ([n]) => n * 3 / 4 * 5 / 7 },
  m02: { pattern: /^Red and blue tiles are in the ratio (\d+):(\d+)\. There are (\d+) more blue tiles than red tiles\. How many tiles are there altogether\?$/, solve: ([a,b,d]) => d / (b-a) * (a+b) },
  m03: { pattern: /^A rectangular garden is (\d+) metres longer than it is wide\. Its perimeter is (\d+) metres\. What is its area in square metres\?$/, solve: ([d,p]) => ((p/2-d)/2) * ((p/2+d)/2) },
  m04: { pattern: /^A science kit costs \$(\d+) before a discount of (\d+)%\. Delivery costs \$(\d+) and is not discounted\. What is the total cost after the discount, including delivery\?$/, solve: ([p,d,s]) => p*(1-d/100)+s },
  m05: { pattern: /^A bag contains (\d+) green counters and (\d+) yellow counters\. Two counters are drawn at random without replacement\. What is the probability that both are yellow\?$/, solve: ([g,y]) => y/(g+y)*(y-1)/(g+y-1) },
  m06: { pattern: /^Three identical notebooks and a \$(\d+) pen cost \$(\d+) altogether\. What is the cost of one notebook\?$/, solve: ([pen,total]) => (total-pen)/3 },
  n01: { pattern: /^A sequence begins (\d+), (\d+), (\d+), (\d+)\. The differences between consecutive terms are consecutive odd numbers, beginning with (\d+)\. What is the next term\?$/, solve: ([a,b,c,d,first]) => b-a===first && c-b===first+2 && d-c===first+4 ? d+first+6 : NaN },
  n02: { pattern: /^Each row follows the same rule: multiply the first number by the second, then subtract the first number\. The rows are \((\d+), (\d+), (\d+)\), \((\d+), (\d+), (\d+)\) and \((\d+), (\d+), \?\)\. What replaces the question mark\?$/, solve: ([a,b,c,d,e,f,g,h]) => a*b-a===c && d*e-d===f ? g*h-g : NaN },
  n03: { pattern: /^A two-digit number has digits whose sum is (\d+)\. Reversing its digits produces a number (\d+) smaller than the original\. What is the original number\?$/, solve: ([sum,diff]) => { const matches = Array.from({length:90},(_,i)=>i+10).filter(n => Math.floor(n/10)+n%10===sum && n-(n%10*10+Math.floor(n/10))===diff); return matches.length===1 ? matches[0] : NaN; } },
  n04: { pattern: /^Two identical sealed boxes and (\d+) loose blocks weigh the same as (\d+) loose blocks\. Each loose block weighs (\d+) grams\. What is the weight of one sealed box in grams\?$/, solve: ([a,b,w]) => (b-a)*w/2 },
  n05: { pattern: /^A bead pattern repeats red, blue, blue, green from position (\d+) onwards\. What colour is the bead at position (\d+)\?$/, solve: ([start,position]) => start===1 && position>=start ? ["Red","Blue","Blue","Green"][(position-start)%4] : NaN },
};
function numericOption(text: string): number {
  const clean = text.replace(/^\$/, "");
  if (/^\d+\/\d+$/.test(clean)) { const [a,b] = clean.split("/").map(Number); return a/b; }
  return /^\d+(\.\d+)?$/.test(clean) ? Number(clean) : NaN;
}
export function recompute(q: Question): { passed: boolean; result: number | string | null } {
  const solver = solvers[q.id.replace("vihaan-p01-", "")];
  const match = solver?.pattern.exec(q.prompt);
  if (!match || q.answerKey.kind !== "single_option") return { passed: false, result: null };
  const result = solver.solve(match.slice(1).map(Number));
  const matches = q.options.filter(o => typeof result === "string" ? o.text === result : Number.isFinite(result) && Math.abs(numericOption(o.text)-result)<1e-9);
  return { passed: matches.length===1 && matches[0].id===q.answerKey.optionId, result: Number.isNaN(result) ? null : result };
}

export function validatePilot(raw: unknown, corpus: readonly { id: string; prompt: string }[] = []) {
  const parsed = pilotSchema.safeParse(raw);
  if (!parsed.success) {
    const drafted = raw && typeof raw==="object" && "items" in raw && Array.isArray(raw.items) ? raw.items.length : 0;
    return { schemaPassed: false, errors: parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`), items: [], counts: { drafted, automatedPass: 0, rejected: drafted, pendingHumanReview: 0, approved: 0, published: 0 } };
  }
  const batch = parsed.data;
  const errors: string[] = [];
  const expected = { numeracy: 6, numerical_reasoning: 5, verbal_reasoning: 4, reading: 3, writing: 2 };
  for (const [s,n] of Object.entries(expected)) if (batch.items.filter(i=>i.question.metadata.subject===s).length!==n) errors.push(`Wrong pilot allocation for ${s}`);
  const ids = batch.items.map(i=>i.question.id);
  const items = batch.items.map(item => {
    const q = item.question;
    const failures: string[] = [];
    const flags = ["human_originality_and_age_suitability_required", "human_approval_required"];
    if (ids.filter(id=>id===q.id).length>1) failures.push("duplicate_id");
    if (q.explanation !== item.workedSolution.join(" ")) failures.push("explanation_working_mismatch");
    if (q.options.length && (q.options.length!==4 || new Set(q.options.map(o=>o.id)).size!==4 || new Set(q.options.map(o=>normalise(o.text))).size!==4)) failures.push("duplicate_or_missing_options");
    if (q.type === "essay") {
      if (q.metadata.subject!=="writing" || q.answerKey.kind!=="manual" || !item.writingGuidance || item.writingGuidance.rubricVersion!==scholarshipWrittenExpressionRubric.version) failures.push("writing_contract_mismatch");
      flags.push("manual_rubric_assessment_required", "writing_taxonomy_onboarding_required");
    } else {
      const skill = skillTaxonomyRegistry.resolve(q.metadata.skill ?? "");
      if (!skill || skill.subject!==q.metadata.subject || skill.strand!==q.metadata.strand || !skill.yearLevels.includes(q.yearLevel) || !skill.recommendedQuestionTypes.includes(q.type)) failures.push("taxonomy_mismatch");
      if (item.writingGuidance) failures.push("unexpected_writing_rubric");
    }
    if (q.type === "reading_comprehension" && !q.stimulus?.body) failures.push("missing_reading_passage");
    if (q.metadata.subject!=="writing" && q.answerKey.kind!=="single_option") failures.push("unsupported_key");
    const descriptiveMetadata = [q.metadata.strand,q.metadata.topic,q.metadata.skill ?? "",...q.metadata.tags].join(" ");
    if (/\b(?:answer|correct|option[ -]?[a-d])\b/i.test(descriptiveMetadata)) failures.push("answer_cue_in_metadata");
    if (/[<>]|https?:\/\/|\b(?:color|favorite|organize)\b/i.test(JSON.stringify(item))) failures.push("unsupported_markup_link_or_us_spelling");
    const peers = [...corpus, ...batch.items.filter(i=>i!==item).map(i=>i.question)];
    const exact = peers.filter(p=>normalise(p.prompt)===normalise(q.prompt));
    if (exact.length) failures.push("duplicate_stem");
    const near = peers.filter(p=>normalise(p.prompt)!==normalise(q.prompt) && similarity(p.prompt,q.prompt)>=0.82);
    if (near.length) flags.push(`near_duplicate_review:${near.map(p=>p.id).join(",")}`);
    const numeric = ["numeracy","numerical_reasoning"].includes(q.metadata.subject);
    const computation = numeric ? recompute(q) : null;
    if (numeric && !computation?.passed) failures.push("recomputed_answer_mismatch_or_unsupported_stem");
    if (["reading","verbal_reasoning","numerical_reasoning"].includes(q.metadata.subject)) flags.push("independent_semantic_review_required");
    return { id: q.id, contentHash: hash(item), automated: failures.length ? "FAIL" : "PASS", computation, failures, flags, publicationEligible: false as const };
  });
  return { schemaPassed: true, batchHash: hash(batch), errors, items, counts: { drafted: items.length, automatedPass: errors.length ? 0 : items.filter(i=>i.automated==="PASS").length, rejected: items.filter(i=>i.automated==="FAIL").length, pendingHumanReview: items.length, approved: 0, published: 0 } };
}
