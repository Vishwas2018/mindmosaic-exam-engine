/**
 * Generates, for Numerical Reasoning and Mathematics:
 *  - the INTERNAL owner packs (answer-bearing)                       docs/reviews/scholarship-2026-10-18/*-OWNER-REVIEW.md
 *  - standalone ANSWER-BLIND reviewer packets (no keys, no solver)   .../answer-blind/*-REVIEWER-PACKET.md
 *  - separate answer-key companions (controlled distribution)        .../answer-key-companions/*.md
 *  - a packet manifest binding each packet to its source bytes and hash
 *
 *   npx tsx scripts/generate-owner-review-packs.mts            regenerate
 *   npx tsx scripts/generate-owner-review-packs.mts --check    verify without writing; exit 1 if stale
 *
 * If any machine key check FAILS the script writes nothing and exits 1: a failed verification never becomes a
 * report that says the key matches. The blind packets are documentation only; no runtime route or bundle serves them.
 */
import "./lib/allow-server-only.mts";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  AuditFailureError,
  REVIEW_DIR,
  SOURCE_PATHS,
  assertNoMachineFailures,
  auditSection,
  buildAnswerKeyCompanion,
  buildBlindPacket,
  buildPacketManifest,
  fsReader,
  loadSections,
  parseAdoptedScope,
  renderOwnerPack,
  scanBlindPacketForDisclosure,
  type BlindPacket,
} from "./lib/scholarship-audit-core";

const checkOnly = process.argv.includes("--check");

const targets = [
  { key: "nr", packetId: "SCH-Y6-NR-BLIND-V1", ownerFile: "NUMERICAL-40-OWNER-REVIEW.md", packetFile: "NUMERICAL-40-REVIEWER-PACKET.md", companionFile: "NUMERICAL-40-ANSWER-KEY-COMPANION.md", docTitle: "NUMERICAL-40-OWNER-REVIEW" },
  { key: "maths", packetId: "SCH-Y6-MATHS-BLIND-V1", ownerFile: "MATHEMATICS-40-OWNER-REVIEW.md", packetFile: "MATHEMATICS-40-REVIEWER-PACKET.md", companionFile: "MATHEMATICS-40-ANSWER-KEY-COMPANION.md", docTitle: "MATHEMATICS-40-OWNER-REVIEW" },
] as const;

const sections = loadSections(fsReader);
const adoptedScope = parseAdoptedScope(fsReader);
const statusDoc = JSON.parse(fsReader.readText(SOURCE_PATHS.pipelineStatus)) as { items: Array<{ id: string; bucket: string }> };
const statusBuckets = new Map(statusDoc.items.map((i) => [i.id, i.bucket]));
const recsDoc = JSON.parse(fsReader.readText(SOURCE_PATHS.difficultyRecommendations)) as {
  assessor?: string;
  recommendations: Record<string, { recommendation: string; rationale: string; label?: string }>;
};
const assessor = recsDoc.assessor ? recsDoc.assessor.split(". ")[0] : "unrecorded";

const outputs = new Map<string, string>();
const manifestEntries: { packetId: string; packetFile: string; companionFile: string; packet: BlindPacket }[] = [];

try {
  for (const t of targets) {
    const section = sections.find((s) => s.spec.key === t.key)!;
    const audit = auditSection(section, fsReader);
    assertNoMachineFailures(audit);
    const packet = buildBlindPacket(section, t.packetId);
    const leaks = scanBlindPacketForDisclosure(packet.text, section.data.questions);
    if (leaks.length > 0) throw new Error(`Blind packet ${t.packetId} leaks answer-revealing content: ${JSON.stringify(leaks)}`);
    outputs.set(`${REVIEW_DIR}/answer-blind/${t.packetFile}`, packet.text);
    outputs.set(`${REVIEW_DIR}/answer-key-companions/${t.companionFile}`, buildAnswerKeyCompanion(section, audit, packet, t.packetFile));
    outputs.set(
      `${REVIEW_DIR}/${t.ownerFile}`,
      renderOwnerPack(section, audit, adoptedScope, statusBuckets, recsDoc.recommendations, assessor, t.packetFile, packet.packetSha256, t.docTitle, fsReader),
    );
    manifestEntries.push({ packetId: t.packetId, packetFile: t.packetFile, companionFile: t.companionFile, packet });
  }
} catch (error) {
  if (error instanceof AuditFailureError) {
    console.error(`AUDIT FAILED. No files written.\n${error.message}`);
  } else {
    console.error(`GENERATION FAILED. No files written.\n${error instanceof Error ? error.message : String(error)}`);
  }
  process.exit(1);
}
outputs.set(`${REVIEW_DIR}/answer-blind/packet-manifest.json`, buildPacketManifest(manifestEntries));

if (checkOnly) {
  const stale = [...outputs].filter(([p, text]) => !existsSync(p) || readFileSync(p, "utf8").replace(/\r\n/g, "\n") !== text).map(([p]) => p);
  if (stale.length > 0) {
    console.error(`STALE generated artefacts:\n${stale.map((p) => `  ${p}`).join("\n")}\nRun without --check and commit the result.`);
    process.exit(1);
  }
  console.log(`OK: ${outputs.size} generated artefacts are current.`);
} else {
  for (const [p, text] of outputs) {
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, text);
    console.log(`Wrote ${p}`);
  }
}
