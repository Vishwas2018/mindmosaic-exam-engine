import { z } from "zod";
import { questionBaseSchema, questionSchema } from "../../src/schemas/question.schema";
import { skillTaxonomyRegistry } from "../../src/features/question-factory/taxonomy/registry";
import { scholarshipWrittenExpressionRubric } from "../../src/features/writing/rubrics/scholarship-written-expression";
import { hash, pilotSchema, recompute, similarity } from "./vihaan-pilot";

export const targets = { numeracy:120, numerical_reasoning:120, verbal_reasoning:120, reading:100, writing:40 };
export const difficultyTargets = { easy:75, medium:225, challenging:200 };
const draftQuestion = questionBaseSchema.strict().extend({
  status:z.literal("draft"),yearLevel:z.literal(6),examStyle:z.literal("scholarship_style"),
  id:z.string().regex(/^vihaan-e500-[mnvrw]\d{3}$/),
  visuals:z.array(z.never()).length(0),media:z.never().optional(),interaction:z.never().optional(),
  metadata:questionBaseSchema.shape.metadata.strict(),
}).superRefine((q,ctx)=>{
  const canonical=questionSchema.safeParse(q);
  if(!canonical.success) for(const issue of canonical.error.issues)
    ctx.addIssue({code:"custom",message:issue.message,path:issue.path});
  if(!["multiple_choice","reading_comprehension","essay"].includes(q.type))
    ctx.addIssue({code:"custom",message:"Unsupported expansion interaction"});
});
export const expansionItemSchema = pilotSchema.shape.items.element.omit({question:true}).extend({
  question:draftQuestion,
  arithmeticCheck:z.object({expression:z.string().min(1).max(500),expected:z.string().min(1)}).strict().optional(),
}).strict();
export const expansionBatchSchema = z.object({
  batchId:z.string().regex(/^vihaan-expansion-(?:0[1-9]|10)$/),version:z.literal(1),status:z.literal("draft"),approvedBy:z.null(),
  provenance:z.object({adapter:z.literal("manual_external"),author:z.string().min(1),model:z.null(),generatedOn:z.literal("2026-11-16"),
    originalGenerationEvidence:z.string().min(20),externalQuestionMaterialUsed:z.literal(false),
    formatReference:z.literal("https://www.edutest.com.au/tests_parents.html"),formatReferenceUse:z.string().min(20),
    promptFile:z.literal("authoring-brief.md")}).strict(),
  retainedPilotIds:z.array(z.string()),items:z.array(expansionItemSchema),
}).strict();
export const expansionManifestSchema = z.object({
  bankId:z.literal("vihaan-scholarship-500"),version:z.literal(1),status:z.literal("draft"),approvedBy:z.null(),
  targets:z.object(Object.fromEntries(Object.entries(targets).map(([k,v])=>[k,z.literal(v)]))).strict(),
  difficultyTargets:z.object({easy:z.literal(75),medium:z.literal(225),challenging:z.literal(200)}).strict(),
  retainedPilot:z.literal("content/vihaan-scholarship/pilot-01/draft.json"),
  batches:z.array(z.object({batchId:z.string(),file:z.string().regex(/^batch-(?:0[1-9]|10)\.draft\.json$/)}).strict()).length(10),
}).strict();

/** Arithmetic grammar, independently implemented from the Python assembler.
 * It checks solution consistency, NOT semantic grounding in the question stem.
 * No eval/Function, candidate code, side effects or access to the environment.
 */
export function evaluateArithmetic(expression:string):number {
  const clean=expression.replace(/\s+/g,"");
  const tokens=clean.match(/\d+(?:\.\d+)?|\*\*|[()+*/%\-]/g)??[];
  if(tokens.join("")!==clean||tokens.length>250) throw new Error("Invalid arithmetic expression");
  let cursor=0;
  function atom():number {
    if(tokens[cursor]==="(") {
      cursor++;const n=sum();if(tokens[cursor++]!==")")throw new Error("Unbalanced arithmetic");return n;
    }
    const token=tokens[cursor++];
    if(!token||!/^\d/.test(token))throw new Error("Expected number");
    return Number(token);
  }
  function power():number {const n=atom();if(tokens[cursor]==="**"){cursor++;return n**unary();}return n;}
  function unary():number {if(tokens[cursor]==="-"){cursor++;return -unary();}return power();}
  function product():number {
    let n=unary();
    while(["*","/","%"].includes(tokens[cursor])) {
      const op=tokens[cursor++],r=unary();
      n=op==="*"?n*r:op==="/"?n/r:((n%r)+r)%r;
    }return n;
  }
  function sum():number {
    let n=product();while(["+","-"].includes(tokens[cursor])){const op=tokens[cursor++],r=product();n=op==="+"?n+r:n-r;}return n;
  }
  const value=sum();
  if(cursor!==tokens.length||!Number.isFinite(value))throw new Error("Invalid arithmetic result");
  return value;
}

export const normaliseStem=(s:string)=>s.toLowerCase().normalize("NFKC").replace(/[^a-z0-9]+/g," ").trim();
// Option signs and decimal points carry mathematical meaning. The stem
// normaliser deliberately discards punctuation and must not be used here.
export const normaliseOption=(s:string)=>Number.isFinite(Number(s))&&s.trim()!==""?String(Number(s)):
  s.toLowerCase().normalize("NFKC").replace(/\s+/g," ").trim();
export type Stem={id:string;prompt:string};
type Item=z.infer<typeof expansionItemSchema> | z.infer<typeof pilotSchema>["items"][number];

export function validateDraftItem(item:Item, retained=false) {
  const q=item.question,failures:string[]=[],flags=["human_approval_required","human_originality_age_difficulty_and_semantic_review_required"];
  const {subject,skill,strand}=q.metadata;
  if(q.explanation!==item.workedSolution.join(" "))failures.push("explanation_working_mismatch");
  if(q.status!=="draft"||q.yearLevel!==6||q.examStyle!=="scholarship_style")failures.push("draft_contract_mismatch");
  if(q.visuals.length||q.media||q.interaction)failures.push("unsupported_asset");
  if(subject==="writing") {
    if(q.type!=="essay"||q.options.length||q.answerKey.kind!=="manual"||!item.writingGuidance||
       item.writingGuidance.rubricId!==scholarshipWrittenExpressionRubric.id||
       item.writingGuidance.rubricVersion!==scholarshipWrittenExpressionRubric.version||
       item.writingGuidance.assessmentMode!=="human_only") failures.push("writing_contract_mismatch");
    flags.push("human_rubric_assessment_required","writing_taxonomy_onboarding_required_before_publication");
  } else {
    const entry=skillTaxonomyRegistry.resolve(skill??"");
    if(!entry||entry.subject!==subject||entry.strand!==strand||!entry.yearLevels.includes(6)||
       !entry.recommendedQuestionTypes.includes(q.type))failures.push("taxonomy_mismatch");
    if(q.options.length!==4||new Set(q.options.map(o=>o.id)).size!==4||
       new Set(q.options.map(o=>normaliseOption(o.text))).size!==4)failures.push("duplicate_or_missing_options");
    if(q.answerKey.kind!=="single_option"||item.writingGuidance)failures.push("mcq_contract_mismatch");
  }
  if(subject==="reading"&&(q.type!=="reading_comprehension"||!q.stimulus?.body||q.stimulus.attribution!=="MindMosaic original"))
    failures.push("reading_contract_mismatch");
  if(subject!=="reading"&&q.stimulus)failures.push("unexpected_stimulus");
  if(/\b(?:answer|correct|option[ -]?[a-d])\b/i.test([strand,q.metadata.topic,skill??"",...q.metadata.tags].join(" ")))
    failures.push("answer_cue_in_metadata");
  if(/[<>]|https?:\/\/|\b(?:color|favorite|organize)\b/i.test(JSON.stringify(item)))failures.push("unsupported_markup_link_or_us_spelling");
  let arithmetic:{method:string;value:number|string|null;passed:boolean}|null=null;
  if(["numeracy","numerical_reasoning"].includes(subject)) {
    if(retained) {const check=recompute(q);arithmetic={method:"pilot_whole_stem_solver",value:check.result,passed:check.passed};}
    else if("arithmeticCheck" in item&&item.arithmeticCheck) {
      try {
        const value=evaluateArithmetic(item.arithmeticCheck.expression);
        const optionId=q.answerKey.kind==="single_option"?q.answerKey.optionId:null;
        const selected=q.options.find(o=>o.id===optionId);
        const matches=q.options.filter(o=>Number.isFinite(Number(o.text))&&Math.abs(Number(o.text)-value)<=0.000001);
        arithmetic={method:"independent_arithmetic_consistency_only",value,passed:!!selected&&matches.length===1&&matches[0].id===selected.id&&Math.abs(Number(item.arithmeticCheck.expected)-value)<=0.000001};
      }catch{arithmetic={method:"independent_arithmetic_consistency_only",value:null,passed:false};}
    } else failures.push("missing_arithmetic_evidence");
    if(arithmetic&&!arithmetic.passed)failures.push("arithmetic_or_key_mismatch");
    if(!retained)flags.push("numeric_stem_grounding_requires_blind_human_solution");
  } else if("arithmeticCheck" in item&&item.arithmeticCheck)failures.push("unexpected_arithmetic_evidence");
  return {id:q.id,contentHash:hash(item),automated:failures.length?"FAIL":"PASS",failures,flags,arithmetic,publicationEligible:false};
}

export function duplicatePairs(stems:readonly Stem[],corpus:readonly Stem[]=[]) {
  const results:{a:string;b:string;kind:string;similarity:number}[]=[];
  const tokenCache=new Map<string,Set<string>>();
  const tokens=(s:string)=>{let t=tokenCache.get(s);if(!t){t=new Set(normaliseStem(s).split(" "));tokenCache.set(s,t);}return t;};
  const compare=(a:Stem,b:Stem)=>{
    if(a.id===b.id&&a===b)return;
    if(normaliseStem(a.prompt)===normaliseStem(b.prompt)) {results.push({a:a.id,b:b.id,kind:"exact_stem",similarity:1});return;}
    const x=tokens(a.prompt),y=tokens(b.prompt);
    if(Math.min(x.size,y.size)/Math.max(x.size,y.size)<0.82)return;
    let overlap=0;for(const t of x)if(y.has(t))overlap++;
    if(overlap/(x.size+y.size-overlap)>=0.82)
      results.push({a:a.id,b:b.id,kind:"near_stem",similarity:similarity(a.prompt,b.prompt)});
    else {
      const strip=(s:string)=>normaliseStem(s.replace(/\b\d+(?:\.\d+)?\b/g,"number"));
      if(strip(a.prompt)===strip(b.prompt))results.push({a:a.id,b:b.id,kind:"parameter_only_variant",similarity:1});
    }
  };
  for(let i=0;i<stems.length;i++) {
    for(let j=0;j<i;j++)compare(stems[i],stems[j]);
    for(const other of corpus)compare(stems[i],other);
  }
  return results;
}
