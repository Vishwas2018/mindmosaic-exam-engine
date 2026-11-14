import "./lib/allow-server-only.mts";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { questionBank } from "../src/content/questions/question-bank";
import { hash, validatePilot } from "./lib/vihaan-pilot";

const base = "content/vihaan-scholarship/pilot-01";
const corpus: { id: string; prompt: string }[] = questionBank.map(q => ({ id:q.id, prompt:q.prompt }));
const corpusFiles: { path: string; sha256: string }[] = [];
// Bounded internal similarity assessment, not a global originality claim.
for (const directory of ["content/scholarship-drafts", "src/content/questions/generated"]) {
  for (const name of (await readdir(directory)).filter(n=>n.endsWith(".json")).sort()) {
    const path = join(directory,name);
    const data: unknown = JSON.parse(await readFile(path,"utf8"));
    corpusFiles.push({ path, sha256: hash(data) });
    const visit = (value: unknown): void => {
      if (!value || typeof value!=="object") return;
      if (Array.isArray(value)) { value.forEach(visit); return; }
      const obj = value as Record<string,unknown>;
      if (typeof obj.prompt==="string" && typeof obj.id==="string") corpus.push({id:obj.id,prompt:obj.prompt});
      Object.values(obj).forEach(visit);
    };
    visit(data);
  }
}
const raw: unknown = JSON.parse(await readFile(`${base}/draft.json`,"utf8"));
const report = { ...validatePilot(raw,corpus), corpus: { comparedRecords:corpus.length, curatedBankHash:hash(questionBank.map(q=>({id:q.id,prompt:q.prompt}))), files:corpusFiles, scope:"Curated stems, generated JSON banks and scholarship draft stems; no external corpus or copyright clearance", nearDuplicateThreshold:0.82 }, reportVersion:1 };
if (process.argv.includes("--write-report")) await writeFile(`${base}/validation-report.json`,JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({schemaPassed:report.schemaPassed,counts:report.counts,errors:report.errors,failedItems:report.items.filter(i=>i.automated==="FAIL"),corpusRecords:corpus.length},null,2));
if (!report.schemaPassed || report.errors.length || report.counts.rejected) process.exitCode=1;
