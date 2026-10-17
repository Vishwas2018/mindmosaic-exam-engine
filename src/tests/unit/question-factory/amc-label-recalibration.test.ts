import { readFileSync, readdirSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { buildAmcReviewTarget } from "../../../../scripts/lib/amc-review-sources.mjs";
const archive="docs/reviews/amc-2026-10-17/superseded-label-approvals";
describe("AMC difficulty-only recalibration",()=>{
 it("preserves every reviewed field except the authorised difficulty label",()=>{
  const files=readdirSync(archive).filter(f=>f.endsWith('.json'));expect(files).toHaveLength(16);
  for(const file of files){const old=JSON.parse(readFileSync(`${archive}/${file}`,'utf8'));const year=old.question.yearLevel;
   const sourceFile=`content/roadmap-drafts/amc-y${year}-draft.json` as "content/roadmap-drafts/amc-y3-draft.json"|"content/roadmap-drafts/amc-y5-draft.json";
   const raw=JSON.parse(readFileSync(sourceFile,'utf8')).questions.find((q:{id:string})=>q.id===old.questionId);
   const target=buildAmcReviewTarget(raw,sourceFile);const current=JSON.parse(readFileSync(`content/publication-approvals/${file}`,'utf8'));
   const reverted=new Set(['roadmap-amc-y3-016','roadmap-amc-y5-013','roadmap-amc-y5-016','roadmap-amc-y5-020','roadmap-amc-y5-024','roadmap-amc-y5-026','roadmap-amc-y5-029']);
   expect(target.question.metadata.difficulty).toBe(reverted.has(old.questionId)?'medium':'easy');
   expect(current.question).toEqual(target.question);
   const comparable=structuredClone(target.question);comparable.metadata.difficulty=old.question.metadata.difficulty;
   expect(comparable,old.questionId).toEqual(old.question);
   expect(current.contentHash).toBe(target.source.contentHash);
   expect(current.approvedBy).toBe('Vishwas Joshi');
  }
 });
});
