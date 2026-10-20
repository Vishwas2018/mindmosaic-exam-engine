import { z } from "zod";
import {hashJson} from '@/features/question-factory/provenance/content-hash';
import {AMC_ATTESTED_CONTENT_HASHES} from '@/features/question-factory/correctness/amc-content-bindings';
const digest=z.string().regex(/^[a-f0-9]{64}$/);
export const amcApprovalSourceSchema=z.object({kind:z.literal('amc_draft_review_source'),schemaVersion:z.literal(1),questionId:z.string().regex(/^roadmap-amc-y[35]-[0-9]{3}$/),revision:z.literal(1),sourceFile:z.enum(['content/roadmap-drafts/amc-y3-draft.json','content/roadmap-drafts/amc-y5-draft.json']),sourceQuestionHash:digest,contentHash:digest}).strict();
export type AmcApprovalSource=z.infer<typeof amcApprovalSourceSchema>;
/** A pre-publication human signature binds this source, avoiding a circular hash of its own later review-chain entry. */
export function verifiedAmcApprovalSourceHash(raw:unknown,id:string,candidateHash:string,publishedHash:string,revision:number):string|undefined{
 const p=amcApprovalSourceSchema.safeParse(raw);if(!p.success)return;
 const s=p.data;const year=id.includes('-y3-')?3:5;
 if(s.questionId!==id||s.revision!==revision||s.sourceQuestionHash!==candidateHash||s.sourceQuestionHash!==AMC_ATTESTED_CONTENT_HASHES[id]||s.contentHash!==publishedHash||s.sourceFile!==`content/roadmap-drafts/amc-y${year}-draft.json`)return;
 return hashJson(s);
}
