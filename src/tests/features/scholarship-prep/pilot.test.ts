import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pilotSchema, validatePilot, recompute } from "../../../../scripts/lib/vihaan-pilot";
import { scoreQuestion } from "@/features/exam-engine/scoring/score-question";
import { selectPractice, summariseProgress, type RecordedOutcome } from "@/features/scholarship-prep/lib/practice";

const raw = JSON.parse(readFileSync("content/vihaan-scholarship/pilot-01/draft.json","utf8"));
const fresh = () => structuredClone(raw) as typeof raw;
describe("pilot validation and existing scorer integration", () => {
  it("validates all 20 drafts while keeping every item pending and unpublishable", () => {
    const r = validatePilot(raw);
    expect(r.schemaPassed).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.counts).toEqual({drafted:20,automatedPass:20,rejected:0,pendingHumanReview:20,approved:0,published:0});
    expect(r.items.every(i=>!i.publicationEligible)).toBe(true);
  });
  it("recomputes all 11 numeric answers from stems", () => {
    const numeric = pilotSchema.parse(raw).items.filter(i=>["numeracy","numerical_reasoning"].includes(i.question.metadata.subject));
    expect(numeric).toHaveLength(11);
    expect(numeric.every(i=>recompute(i.question).passed)).toBe(true);
  });
  it("rejects a wrong key and recomputes changed givens rather than trusting explanations", () => {
    const a=fresh(); a.items[0].question.answerKey.optionId="a";
    expect(validatePilot(a).items[0].failures).toContain("recomputed_answer_mismatch_or_unsupported_stem");
    const b=fresh(); b.items[0].question.prompt=b.items[0].question.prompt.replace("84","112");
    expect(validatePilot(b).items[0].computation?.result).toBe(60);
    expect(validatePilot(b).items[0].automated).toBe("FAIL");
    const c=fresh(); c.items[0].question.prompt+=" Give a different answer.";
    expect(validatePilot(c).items[0].computation?.result).toBeNull();
  });
  it("rejects duplicate and numerically equivalent answer options", () => {
    const a=fresh(); a.items[0].question.options[0].text="45";
    expect(validatePilot(a).items[0].failures).toContain("duplicate_or_missing_options");
    const b=fresh(); b.items[0].question.options[0].text="45.0";
    expect(validatePilot(b).items[0].failures).toContain("recomputed_answer_mismatch_or_unsupported_stem");
  });
  it("rejects duplicate IDs, repeated stems and flags near duplicates", () => {
    const a=fresh(); a.items[1].question.id=a.items[0].question.id;
    expect(validatePilot(a).items[0].failures).toContain("duplicate_id");
    const q=raw.items[0].question;
    expect(validatePilot(raw,[{id:"existing",prompt:q.prompt}]).items[0].failures).toContain("duplicate_stem");
    expect(validatePilot(raw,[{id:"similar",prompt:q.prompt.replace("84","112")}]).items[0].flags.join()).toContain("near_duplicate_review:similar");
  });
  it("fails closed on publication, fabricated approval, visuals and leaked metadata", () => {
    for (const mutate of [
      (a:typeof raw)=>{a.items[0].question.status="published";},
      (a:typeof raw)=>{a.approvedBy="AI";},
      (a:typeof raw)=>{a.items[0].question.visuals=[{type:"svg",markup:"<svg/>"}];},
      (a:typeof raw)=>{a.items[0].question.metadata.correctAnswer="b";},
      (a:typeof raw)=>{a.items[0].question.options[0].accessibleLabel="Correct answer b";},
    ]) { const a=fresh(); mutate(a); const result=validatePilot(a); expect(result.schemaPassed).toBe(false); expect(result.counts.automatedPass).toBe(0); }
  });
  it("rejects unsupported taxonomy, markup and inconsistent working", () => {
    const a=fresh(); a.items[0].question.metadata.skill="made-up";
    expect(validatePilot(a).items[0].failures).toContain("taxonomy_mismatch");
    const b=fresh(); b.items[0].workedSolution[0]="<script>alert(1)</script>";
    const failures=validatePilot(b).items[0].failures;
    expect(failures).toContain("unsupported_markup_link_or_us_spelling");
    expect(failures).toContain("explanation_working_mismatch");
  });
  it("uses existing scoring for objective answers and keeps essays pending", () => {
    for (const {question:q} of pilotSchema.parse(raw).items) {
      if(q.answerKey.kind==="single_option") {
        expect(scoreQuestion(q,(q.answerKey as { optionId: string }).optionId).status).toBe("correct");
        expect(scoreQuestion(q,q.options.find(o=>o.id!==(q.answerKey as { optionId: string }).optionId)!.id).status).toBe("incorrect");
      } else {
        expect(scoreQuestion(q,"My original draft response").requiresManualMarking).toBe(true);
        expect(scoreQuestion(q,"My original draft response").awardedMarks).toBe(0);
      }
    }
  });
});
describe("practice planning and truthful progress",()=>{
  it("never selects drafts and shuffles unique published items without mutating the bank",()=>{
    const qs=pilotSchema.parse(raw).items.map(i=>i.question);
    expect(selectPractice(qs,5)).toEqual([]);
    const published=qs.map(q=>({...q,status:"published" as const}));
    const before=structuredClone(published);
    const selected=selectPractice([...published,published[0]],6,{subject:"numeracy",random:()=>0});
    expect(selected).toHaveLength(6);
    expect(new Set(selected.map(q=>q.id)).size).toBe(6);
    expect(selected[0].id).not.toBe(published[0].id);
    expect(published).toEqual(before);
    expect(selectPractice(published,4,{weakTopics:["Fraction of a remainder"]})).toHaveLength(1);
  });
  it("keeps empty history empty and writing out of accuracy",()=>{
    expect(summariseProgress([])).toEqual({topics:[],pendingWriting:0,weakTopics:[]});
    const row:RecordedOutcome={responseId:"response-1",questionId:"vihaan-p01-w01",topic:"Writing",subject:"writing",submittedAt:"2026-11-13T01:00:00Z",elapsedSeconds:600,status:"pending_manual_review"};
    expect(summariseProgress([row,row])).toEqual({topics:[],pendingWriting:1,weakTopics:[]});
    expect(summariseProgress([{...row,status:"correct"}])).toEqual({topics:[],pendingWriting:0,weakTopics:[]});
  });
  it("requires diverse real responses for weakness and ignores duplicates, invalid dates and omissions",()=>{
    const rows:RecordedOutcome[]=Array.from({length:5},(_,i)=>({responseId:`r${i}`,questionId:`vihaan-q${i}`,topic:"Ratio",subject:"numeracy",submittedAt:"2026-11-13T01:00:00Z",elapsedSeconds:60,status:i<2?"correct":"incorrect"}));
    const result=summariseProgress([...rows,rows[0],{...rows[0],responseId:"bad",submittedAt:"invalid"},{...rows[0],responseId:"blank",status:"unanswered"}]);
    expect(result.topics[0]).toMatchObject({attempted:5,distinctQuestions:5,accuracyPercent:40,meanSeconds:60,sufficientEvidence:true});
    expect(result.weakTopics).toEqual(["Ratio"]);
    expect(summariseProgress(rows.slice(0,4)).weakTopics).toEqual([]);
  });
});
