import "./lib/allow-server-only.mts";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { questionBank } from "../src/content/questions/question-bank";
import { hash, pilotSchema, validatePilot } from "./lib/vihaan-pilot";
import { difficultyTargets, duplicatePairs, expansionBatchSchema, expansionManifestSchema, targets, validateDraftItem, type Stem } from "./lib/vihaan-expansion";

const base="content/vihaan-scholarship/expansion-500";
const read=async(path:string):Promise<unknown>=>JSON.parse(await readFile(path,"utf8"));
const pilot=pilotSchema.parse(await read("content/vihaan-scholarship/pilot-01/draft.json"));
const corpus:Stem[]=questionBank.map(q=>({id:q.id,prompt:q.prompt}));
const corpusFiles:{path:string;sha256:string}[]=[];
for(const directory of ["content/scholarship-drafts","src/content/questions/generated"]) {
  for(const name of (await readdir(directory)).filter(n=>n.endsWith(".json")).sort()) {
    const path=join(directory,name),data=await read(path);
    corpusFiles.push({path,sha256:hash(data)});
    const visit=(value:unknown):void=>{
      if(!value||typeof value!=="object")return;
      if(Array.isArray(value)){value.forEach(visit);return;}
      const obj=value as Record<string,unknown>;
      if(typeof obj.id==="string"&&typeof obj.prompt==="string")corpus.push({id:obj.id,prompt:obj.prompt});
      Object.values(obj).forEach(visit);
    };visit(data);
  }
}
const batchArg=process.argv.indexOf("--batch");
const batchNumber=batchArg<0?null:Number(process.argv[batchArg+1]);
if(batchNumber!==null&&(!Number.isInteger(batchNumber)||batchNumber<1||batchNumber>10))throw new Error("Use --batch 1 through 10");
const manifest=batchNumber===null?expansionManifestSchema.parse(await read(`${base}/bank.draft.json`)):null;
const names=manifest?manifest.batches.map(b=>b.file):Array.from({length:batchNumber!},(_,i)=>`batch-${String(i+1).padStart(2,"0")}.draft.json`);
const batches=await Promise.all(names.map(async file=>({file,data:expansionBatchSchema.parse(await read(`${base}/${file}`))})));
const errors:string[]=[];
const pilotResult=validatePilot(pilot,corpus);
if(!pilotResult.schemaPassed||pilotResult.errors.length||pilotResult.counts.rejected)errors.push("Retained pilot validation failed");
const seen=new Set<string>();
const retainedIds=new Set<string>();
const expanded=batches.map(({file,data},index)=>{
  if(data.batchId!==`vihaan-expansion-${String(index+1).padStart(2,"0")}`)errors.push(`${file}: batch sequence mismatch`);
  if(manifest&&manifest.batches[index].batchId!==data.batchId)errors.push(`${file}: manifest batch mismatch`);
  const retained=data.retainedPilotIds.map(id=>{
    const item=pilot.items.find(i=>i.question.id===id);
    if(!item)throw new Error(`${file}: unknown retained pilot ID ${id}`);
    if(retainedIds.has(id))errors.push(`Duplicate retained pilot reference: ${id}`);
    retainedIds.add(id);return item;
  });
  if(index===0&&(retained.length!==20||data.items.length!==30))errors.push("First review unit requires 20 retained + 30 new items");
  if(index>0&&(retained.length||data.items.length!==50))errors.push(`${file}: requires 50 new items`);
  const items=[...retained,...data.items];
  if(items.length!==50)errors.push(`${file}: review unit is not 50 items`);
  for(const {question:q} of items){if(seen.has(q.id))errors.push(`Duplicate item ID: ${q.id}`);seen.add(q.id);}
  return {file,data,items,checks:items.map(item=>validateDraftItem(item,data.retainedPilotIds.includes(item.question.id)))};
});
const items=expanded.flatMap(b=>b.items),checks=expanded.flatMap(b=>b.checks);
const duplicates=duplicatePairs(items.map(i=>i.question),corpus);
if(duplicates.length)errors.push(`${duplicates.length} exact/near/parameter-only stem matches require revision`);
for(const item of checks)if(item.failures.length)errors.push(`${item.id}: ${item.failures.join(", ")}`);
const count=(values:string[])=>Object.fromEntries([...new Set(values)].sort().map(s=>[s,values.filter(v=>v===s).length]));
const subjects=count(items.map(i=>i.question.metadata.subject));
const difficulties=count(items.map(i=>i.question.metadata.difficulty));
if(manifest) {
  for(const [key,value]of Object.entries(targets))if(subjects[key]!==value)errors.push(`Wrong subject total ${key}`);
  for(const [key,value]of Object.entries(difficultyTargets))if(difficulties[key]!==value)errors.push(`Wrong difficulty total ${key}`);
  if(items.length!==500||retainedIds.size!==20)errors.push("Bank must contain 500 unique items, including the retained 20");
}
const corpusSnapshot={comparedRecords:corpus.length,curatedBankHash:hash(questionBank.map(q=>({id:q.id,prompt:q.prompt}))),files:corpusFiles,
  scope:"Curated questionBank stems, generated JSON banks, scholarship draft JSON, retained pilot and all expansion batches (earlier batches only in --batch mode). No external question corpus or copyright clearance.",nearDuplicateThreshold:0.82,
  methods:["normalised exact stems","existing pilot token Jaccard similarity >= 0.82","identical wording after replacing numeric literals"]};
const selected=batchNumber===null?expanded:expanded.filter((_,i)=>i===batchNumber-1);
const batchReports=selected.map(b=>{
  const ids=new Set(b.items.map(i=>i.question.id));
  const matches=duplicates.filter(p=>ids.has(p.a)||ids.has(p.b));
  return {batchId:b.data.batchId,version:1,status:"draft",approvedBy:null,publicationEligible:false,
    sourceFile:b.file,sourceHash:hash(b.data),pilotSourceHash:b.data.retainedPilotIds.length?hash(pilot):null,
    itemCount:b.items.length,newItems:b.data.items.length,retainedPilotItems:b.data.retainedPilotIds.length,
    automatedPassed:b.checks.filter(i=>i.automated==="PASS").length,duplicates:matches,
    passed:b.checks.every(i=>i.automated==="PASS")&&!matches.length&&!errors.length,
    subjectCounts:count(b.items.map(i=>i.question.metadata.subject)),difficultyCounts:count(b.items.map(i=>i.question.metadata.difficulty)),
    corpusSnapshotHash:hash(corpusSnapshot),checks:b.checks};
});
if(process.argv.includes("--write-report")) {
  for(const report of batchReports)await writeFile(`${base}/${report.sourceFile.replace(".draft.json",".validation.json")}`,JSON.stringify(report,null,2)+"\n");
  if(manifest) {
    const passages=[...new Map(items.filter(i=>i.question.stimulus).map(i=>[i.question.stimulus!.title,i.question.stimulus!])).values()];
    const report={reportVersion:1,generatedOn:"2026-11-16",bankId:manifest.bankId,status:"draft",approvedBy:null,
      passed:!errors.length,errors,total:items.length,newItems:480,retainedItems:20,approved:0,published:0,publicationEligible:false,
      subjectCounts:subjects,difficultyCounts:difficulties,
      coverage:Object.fromEntries(Object.keys(targets).map(subject=>[subject,{count:subjects[subject],
        difficulty:count(items.filter(i=>i.question.metadata.subject===subject).map(i=>i.question.metadata.difficulty)),
        skills:count(items.filter(i=>i.question.metadata.subject===subject).map(i=>i.question.metadata.skill??i.question.metadata.topic))}])),
      answerPositions:count(items.flatMap(i=>i.question.answerKey.kind==="single_option"?[i.question.answerKey.optionId]:[])),
      timeRanges:Object.fromEntries(Object.keys(targets).map(s=>[s,{minimumSeconds:Math.min(...items.filter(i=>i.question.metadata.subject===s).map(i=>i.question.metadata.estimatedTimeSeconds)),maximumSeconds:Math.max(...items.filter(i=>i.question.metadata.subject===s).map(i=>i.question.metadata.estimatedTimeSeconds))}])),
      passages:passages.map(p=>({title:p.title,wordCount:p.body.split(/\s+/).filter(Boolean).length,questionCount:items.filter(i=>i.question.stimulus?.title===p.title).length})),
      duplicateMatches:duplicates,corpus:corpusSnapshot,
      validation:{canonicalSchema:500,taxonomyCheckedNonWriting:460,manualWritingRubric:40,
        independentPilotWholeStemNumericalSolvers:checks.filter(c=>c.arithmetic?.method==="pilot_whole_stem_solver").length,
        expansionArithmeticConsistency:checks.filter(c=>c.arithmetic?.method==="independent_arithmetic_consistency_only").length,
        semanticAndNumericStemGrounding:"Pending blind human solutions. Arithmetic evidence is authored alongside content, not an independent semantic proof.",
        difficultyAndTiming:"Authored estimates, not psychometrically calibrated or official test timings.",
        originality:"Session-authored; no external question material used. Bounded internal similarity screening does not establish worldwide uniqueness."},
      requiredHumanReview:["Solve every MCQ without its key; justify rejection of each distractor.","Check each reading key against passage evidence, including alternative interpretations.","Check age suitability, difficulty and time estimates.","Review originality and numerical stem-to-solution grounding.","Onboard writing skills through the governed taxonomy before any publication.","Record human approval through the existing governed lifecycle; this package cannot publish."],
      batches:batchReports.map(b=>({batchId:b.batchId,sourceFile:b.sourceFile,sourceHash:b.sourceHash,
        itemCount:b.itemCount,newItems:b.newItems,retainedPilotItems:b.retainedPilotItems,
        automatedPassed:b.automatedPassed,passed:b.passed,subjectCounts:b.subjectCounts,difficultyCounts:b.difficultyCounts})),
      sources:{manifestHash:hash(manifest),pilotHash:hash(pilot),batchHashes:batchReports.map(b=>({file:b.sourceFile,hash:b.sourceHash}))}};
    await writeFile(`${base}/quality-coverage-report.json`,JSON.stringify(report,null,2)+"\n");
  }
}
console.log(JSON.stringify({mode:batchNumber===null?"consolidated":`batch-${batchNumber}`,passed:!errors.length,total:items.length,subjects,difficulties,
  errors,duplicates,batches:batchReports.map(b=>({batchId:b.batchId,itemCount:b.itemCount,passed:b.passed}))},null,2));
if(errors.length)process.exitCode=1;
