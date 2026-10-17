import {blueprintSchema,validateBlueprint} from '@/features/question-factory/blueprints';
import {skillTaxonomyRegistry} from '@/features/question-factory/taxonomy';
import type {CandidateQuestion} from '@/features/question-factory/ingestion/candidate-question';
export function amcIntakeBlueprint(q:CandidateQuestion){
 const skill=skillTaxonomyRegistry.resolveOrThrow(q.metadata.skill!);
 const blueprint=blueprintSchema.parse({id:`${q.id.replace('roadmap-','')}-seed-001`,batchId:'amc-reviewed-2026-10-17',yearLevel:`year-${q.yearLevel}`,examStyle:q.examStyle,subject:q.metadata.subject,strand:q.metadata.strand,skill:skill.id,difficulty:q.metadata.difficulty,questionType:q.type,targetCount:1,marks:q.metadata.marks,estimatedTimeSeconds:q.metadata.estimatedTimeSeconds,learningObjective:skill.displayName,misconceptionTargets:[],reasoningSteps:q.metadata.difficulty==='challenging'?5:q.metadata.difficulty==='medium'?3:1,accessibilityConstraints:[],originalityConstraints:['Original first-party practice content; verify against the current published corpus.'],generationConstraints:['Import the reviewed source verbatim; never synthesize correctness or review evidence.']});
 const result=validateBlueprint(blueprint);if(!result.valid)throw Error(JSON.stringify(result.issues));return blueprint;
}
