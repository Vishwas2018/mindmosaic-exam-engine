import './lib/allow-server-only.mts';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {loadAmcReviewTargets,AMC_EXCLUDED_FROM_REVIEW} from './lib/amc-review-sources.mjs';
import {amcIntakeBlueprint} from './lib/amc-intake-blueprint.mjs';
import {candidateQuestionSchema} from '@/features/question-factory/ingestion/candidate-question';
import {verifyFirstPartyAmcAttestation} from '@/features/question-factory/correctness/amc-attestation';
// Source preparation plus the REAL ingestion CLI only. No gate reports,
// review chains, lifecycle transitions, attestations or manifests are written here.
const targets=(await loadAmcReviewTargets()).filter(t=>!AMC_EXCLUDED_FROM_REVIEW[t.question.id]);
if(targets.length!==57)throw Error('Expected exactly 57 approved intake targets');
for(const target of targets){
 const packet=JSON.parse(await readFile(target.source.sourceFile,'utf8'));
 const q=candidateQuestionSchema.parse(packet.questions.find((q:{id:string})=>q.id===target.question.id));
 const verified=verifyFirstPartyAmcAttestation(q,target.source.sourceQuestionHash);if(!verified.ok)throw Error(verified.message);
 const blueprint=amcIntakeBlueprint(q);const text=JSON.stringify(blueprint,null,2)+'\n';
 const file=`content/question-factory/blueprints/${blueprint.id}.json`;
 try{await writeFile(file,text,{flag:'wx'});}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST'||await readFile(file,'utf8')!==text)throw e;}
 const inbox=`content/question-factory/inbox/amc-reviewed/${q.id}`;await mkdir(inbox,{recursive:true});
 await writeFile(`${inbox}/${q.id}.json`,JSON.stringify(q,null,2)+'\n',{flag:'wx'});
 const run=spawnSync(process.execPath,['--import','tsx','scripts/questions-ingest.mts','--source','chatgpt','--batch-id','amc-reviewed-2026-10-17','--pipeline-run-id','amc-reviewed-intake-2026-10-17','--prompt-version','existing-roadmap-draft-import-1','--blueprint-id',blueprint.id,'--inbox',inbox,'--json'],{encoding:'utf8',cwd:process.cwd()});
 process.stdout.write(run.stdout??'');process.stderr.write(run.stderr??'');if(run.error)throw run.error;if(run.status!==0)throw Error(`Governed ingestion refused ${q.id}: exit ${run.status}`);
}
console.log('57 reviewed sources ingested through questions:ingest; no staging or publication claimed.');
