/** Explicit external answer-withheld review; credentials only from server environment. */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const dir = 'docs/reviews/scholarship-sample-2026-10-21';
const sha = text => createHash('sha256').update(text).digest('hex');
const packet = await readFile(`${dir}/packet.json`, 'utf8');
const manifest = JSON.parse(await readFile(`${dir}/approval-manifest.json`, 'utf8'));
if (sha(packet) !== manifest.packetSha256) throw new Error('Stale packet');
const model = 'gemini-3.1-pro-preview';
const prompt = `Independently solve ALL 12 original Australian Year 6 scholarship practice items below. This is a fresh stateless request. You receive no answer keys, explanations, prior reviews or difficulty labels. For each item: solve first; assess uniqueness, factual accuracy, distractors, age suitability, length or copied wording cues. Rate reasoning difficulty easy, medium or challenging. Do not request cosmetic rewrites based only on length. Timing is unvalidated author judgement. Return only JSON {"items":[{"id":"...","myAnswer":"a|b|c|d|e|none","reasoning":"...","singleDefensibleAnswer":true,"issues":"... or empty","difficulty":"easy|medium|challenging","verdict":"PASS|REVISE|REJECT","fix":"... or empty"}]}. Do not claim a provider/model identity; the caller will retain the API-returned identity.\n\n${packet}`;
const request = { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } };
await writeFile(`${dir}/api-request.json`, JSON.stringify(request, null, 2) + '\n');
if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY unavailable');
const startedAt = new Date().toISOString();
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY }, body: JSON.stringify(request),
});
const raw = await response.text();
await writeFile(`${dir}/api-response.json`, raw);
const body = JSON.parse(raw);
const execution = { providerEndpoint: 'https://generativelanguage.googleapis.com/v1beta', requestedModel: model,
  returnedModelVersion: body.modelVersion ?? null, responseId: body.responseId ?? null,
  startedAt, completedAt: new Date().toISOString(), httpStatus: response.status,
  responseHeaders: Object.fromEntries(['date', 'x-request-id', 'x-goog-request-id'].flatMap(k => response.headers.has(k) ? [[k,response.headers.get(k)]] : [])),
  packetSha256: sha(packet), requestFileSha256: sha(await readFile(`${dir}/api-request.json`, 'utf8')), responseSha256: sha(raw),
  transport: 'Single stateless HTTPS generateContent request; no previous messages, keys or prior reviews in request',
};
await writeFile(`${dir}/execution.json`, JSON.stringify(execution, null, 2) + '\n');
if (!response.ok) throw new Error(`Provider HTTP ${response.status}; see retained response`);
if (!body.modelVersion) throw new Error('API did not return model identity');
const result = JSON.parse(body.candidates[0].content.parts.filter(p => p.text).map(p => p.text).join(''));
if (result.items.length !== 12 || new Set(result.items.map(q => q.id)).size !== 12 || manifest.items.some(q => !result.items.some(r => r.id === q.id))) throw new Error('Invalid review coverage');
const keys = new Map();
for (const source of new Set(manifest.items.map(q => q.sourcePath))) {
  for (const q of JSON.parse(await readFile(source, 'utf8')).questions) keys.set(q.id, q.answerKey.optionId);
}
const summary = { ...execution, itemCount: result.items.length, agreeWithKey: result.items.filter(q => q.myAnswer === keys.get(q.id)).length,
  disagreements: result.items.filter(q => q.myAnswer !== keys.get(q.id)).map(q => q.id),
  unresolvedFindings: result.items.filter(q => q.verdict !== 'PASS' || !q.singleDefensibleAnswer || q.issues).map(q => ({id:q.id, verdict:q.verdict, issues:q.issues, fix:q.fix})),
  difficultyDifferences: result.items.filter(q => q.difficulty !== manifest.items.find(m => m.id === q.id).difficulty).map(q => ({id:q.id, declared:manifest.items.find(m => m.id === q.id).difficulty, reviewer:q.difficulty})),
  items: result.items, governanceStatus: 'Advisory external evidence only. Per-candidate factory ingest and human decisions remain pending.',
};
await writeFile(`${dir}/review-summary.json`, JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({httpStatus:response.status,model:body.modelVersion,responseId:body.responseId,items:12,agree:summary.agreeWithKey,findings:summary.unresolvedFindings}));

