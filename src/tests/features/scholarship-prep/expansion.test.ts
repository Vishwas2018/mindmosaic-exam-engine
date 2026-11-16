import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { pilotSchema } from "../../../../scripts/lib/vihaan-pilot";
import {
  duplicatePairs, evaluateArithmetic, expansionBatchSchema, expansionManifestSchema,
  normaliseOption, validateDraftItem,
} from "../../../../scripts/lib/vihaan-expansion";

const base="content/vihaan-scholarship/expansion-500";
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const manifest=expansionManifestSchema.parse(read(`${base}/bank.draft.json`));
const batches=manifest.batches.map(b=>expansionBatchSchema.parse(read(`${base}/${b.file}`)));
const pilot=pilotSchema.parse(read("content/vihaan-scholarship/pilot-01/draft.json"));
const drafts=batches.flatMap(b=>b.items);
const numeric=drafts.find(i=>i.question.metadata.subject==="numeracy")!;

describe("Vihaan expansion review-bank governance",()=>{
  it("retains each pilot once and completes exact subject and difficulty targets",()=>{
    expect(batches[0].retainedPilotIds).toEqual(pilot.items.map(i=>i.question.id));
    expect(batches.slice(1).every(b=>b.retainedPilotIds.length===0)).toBe(true);
    expect(batches.map(b=>b.items.length+b.retainedPilotIds.length)).toEqual(Array(10).fill(50));
    const all=[...pilot.items,...drafts];
    expect(new Set(all.map(i=>i.question.id)).size).toBe(500);
    for(const [subject,target] of Object.entries(manifest.targets))
      expect(all.filter(i=>i.question.metadata.subject===subject)).toHaveLength(target);
    for(const [difficulty,target] of Object.entries(manifest.difficultyTargets))
      expect(all.filter(i=>i.question.metadata.difficulty===difficulty)).toHaveLength(target);
  });

  it("validates all 480 new items without granting publication eligibility",()=>{
    expect(drafts).toHaveLength(480);
    for(const draft of drafts) {
      const result=validateDraftItem(draft);
      expect(result.failures,result.id).toEqual([]);
      expect(result.publicationEligible).toBe(false);
      expect(result.flags).toContain("human_approval_required");
    }
  });

  it("rejects approval, published status and arbitrary metadata/visual fields",()=>{
    const batch=structuredClone(batches[0]);
    expect(expansionBatchSchema.safeParse({...batch,approvedBy:"AI"}).success).toBe(false);
    for(const mutation of [
      {...numeric.question,status:"published"},
      {...numeric.question,metadata:{...numeric.question.metadata,correctAnswer:"b"}},
      {...numeric.question,visuals:[{svg:"<svg/>"}]},
    ])expect(expansionBatchSchema.safeParse({...batch,items:[{...numeric,question:mutation}]}).success).toBe(false);
  });

  it("detects a wrong key or arithmetic evidence, rather than trusting the authoring result",()=>{
    const changed=structuredClone(numeric);
    if(changed.question.answerKey.kind!=="single_option")throw new Error("Fixture must be MCQ");
    const originalId=changed.question.answerKey.optionId;
    changed.question.answerKey.optionId=changed.question.options.find(o=>o.id!==originalId)!.id;
    expect(validateDraftItem(changed).failures).toContain("arithmetic_or_key_mismatch");
    const evidence=structuredClone(numeric);
    evidence.arithmeticCheck={expression:"999+1",expected:"1000"};
    expect(validateDraftItem(evidence).failures).toContain("arithmetic_or_key_mismatch");
  });

  it("preserves signed mathematical options and rejects equivalent duplicates",()=>{
    expect(normaliseOption("-7")).not.toBe(normaliseOption("7"));
    expect(normaliseOption("1.50")).toBe(normaliseOption("1.5"));
    const changed=structuredClone(numeric);
    changed.question.options[1].text=changed.question.options[0].text;
    expect(validateDraftItem(changed).failures).toContain("duplicate_or_missing_options");
  });

  it("screens exact, near and numeric-substitution stems against peers and corpus",()=>{
    const q={id:"one",prompt:"A coach packs 84 distinct badges into seven equal boxes. How many badges go into each box?"};
    const pairs=duplicatePairs([q,{id:"two",prompt:q.prompt.replace("84","98")}],[{id:"old",prompt:q.prompt}]);
    expect(pairs.some(p=>p.kind==="exact_stem")).toBe(true);
    expect(pairs.some(p=>p.b==="one"&&p.a==="two")).toBe(true);
    expect(duplicatePairs([...pilot.items,...drafts].map(i=>i.question))).toEqual([]);
  }, 15_000);

  it("checks grammar precedence and refuses executable or invalid arithmetic",()=>{
    expect(evaluateArithmetic("-2**2 + 3*(8-2)/2")).toBe(5);
    expect(evaluateArithmetic("2**3**2")).toBe(512);
    expect(evaluateArithmetic("29%6")).toBe(5);
    for(const value of ["process.exit()","1/0","2+","(2*3","Math.random()","2;3"])
      expect(()=>evaluateArithmetic(value)).toThrow();
  });

  it("requires the existing manual rubric and passage evidence",()=>{
    const writing=structuredClone(drafts.find(i=>i.question.metadata.subject==="writing")!);
    writing.writingGuidance=null;
    expect(validateDraftItem(writing).failures).toContain("writing_contract_mismatch");
    const reading=structuredClone(drafts.find(i=>i.question.metadata.subject==="reading")!);
    delete reading.question.stimulus;
    expect(validateDraftItem(reading).failures).toContain("reading_contract_mismatch");
  });
});
