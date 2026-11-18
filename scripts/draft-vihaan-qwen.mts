import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

/** Optional local drafting assistant. Saves untrusted raw evidence only.
 * Never ingests, stages, approves or publishes its output. No network fallback.
 * node --import tsx scripts/draft-vihaan-qwen.mts --model <installed-qwen-tag>
 */
const modelIndex = process.argv.indexOf("--model");
const model = modelIndex>=0 ? process.argv[modelIndex+1] : undefined;
if (!model || !/^qwen[a-z0-9_.:-]*$/i.test(model)) throw new Error("Supply an installed Qwen model using --model");
const endpoint = "http://127.0.0.1:11434";
const tagsResponse = await fetch(`${endpoint}/api/tags`,{signal:AbortSignal.timeout(5000)});
if (!tagsResponse.ok) throw new Error(`Local model inventory failed: ${tagsResponse.status}`);
const tags = await tagsResponse.json() as {models?:{name:string;digest:string}[]};
const installed = tags.models?.find(m=>m.name===model);
if (!installed?.digest) throw new Error("Requested Qwen model is not installed or lacks a digest");
const prompt = await readFile("content/vihaan-scholarship/pilot-01/authoring-brief.md","utf8");
const request = {model,prompt:prompt+"\nDraft up to four candidate questions only as JSON. This is untrusted draft assistance; do not claim any review or approval.",stream:false,format:"json",options:{temperature:0.4,num_predict:4096}};
const response = await fetch(`${endpoint}/api/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(request),signal:AbortSignal.timeout(300000)});
const rawResponse = await response.text();
const out = `content/vihaan-scholarship/qwen-inbox/${new Date().toISOString().replace(/[:.]/g,"-")}`;
await mkdir(out,{recursive:true});
await writeFile(`${out}/draft-evidence.json`,JSON.stringify({recordedAt:new Date().toISOString(),endpoint,model,digest:installed.digest,request,requestHash:createHash("sha256").update(JSON.stringify(request)).digest("hex"),httpStatus:response.status,rawResponse,classification:"local_untrusted_draft_not_governance_evidence"},null,2)+"\n",{flag:"wx"});
if (!response.ok) throw new Error(`Local draft failed with HTTP ${response.status}; response saved at ${out}`);
console.log(`Untrusted draft evidence saved at ${out}. Review and validate manually; no content imported.`);
