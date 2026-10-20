import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {verifyCandidateDifficulty} from '@/features/question-factory/difficulty/verify-candidate-difficulty';
import {baseProvenance} from './correctness-fixtures';
const q=JSON.parse(readFileSync('content/roadmap-drafts/amc-y5-draft.json','utf8')).questions.find((q:{id:string})=>q.id==='roadmap-amc-y5-027');
const context={validatedAt:'2026-10-17T00:00:00.000Z',declaredDifficulty:'challenging' as const,blueprintHash:'test-blueprint-hash'};
const candidate={candidateId:q.id,state:'originality_review_passed',question:q,provenance:baseProvenance(q)};
describe('AMC text proxy is advisory, not cognitive calibration',()=>{
 it('retains the challenging label and fingerprints a visible non-blocking warning',()=>{
  const r=verifyCandidateDifficulty(candidate,context);
  expect(r.status).toBe('passed');expect(r.outcome).toBe('advisory');
  expect(r.evidence.declaredDifficulty).toBe('challenging');expect(r.evidence.estimatedDifficulty).toBe('easy');
  expect(r.evidence.issues).toMatchObject([{code:'difficulty_deviation_exceeded',severity:'review_required'}]);
  expect(r.evidence.difficultyFingerprint).toBeTruthy();
 });
 it('leaves non-AMC difficulty mismatches blocking',()=>{
  const question=structuredClone(q);question.metadata.subject='numeracy';question.examStyle='naplan_style';
  expect(verifyCandidateDifficulty({...candidate,question,provenance:baseProvenance(question)},context).status).toBe('failed');
 });
 it('still rejects malformed AMC provenance',()=>{
  expect(verifyCandidateDifficulty({...candidate,provenance:{}},context).status).toBe('quarantined');
 });
});
