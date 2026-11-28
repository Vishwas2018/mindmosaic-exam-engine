import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  BLIND_FORBIDDEN_TERMS,
  REVIEW_DIR,
  buildBlindPacket,
  fsReader,
  loadSections,
  packetHashOf,
  scanBlindPacketForDisclosure,
  type DraftQuestion,
} from "../../../scripts/lib/scholarship-audit-core";

const sections = loadSections(fsReader);
const targets = [
  { key: "nr", packetFile: "NUMERICAL-40-REVIEWER-PACKET.md", companionFile: "NUMERICAL-40-ANSWER-KEY-COMPANION.md", packetId: "SCH-Y6-NR-BLIND-V1" },
  { key: "maths", packetFile: "MATHEMATICS-40-REVIEWER-PACKET.md", companionFile: "MATHEMATICS-40-ANSWER-KEY-COMPANION.md", packetId: "SCH-Y6-MATHS-BLIND-V1" },
] as const;

const read = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");

describe.each(targets)("answer-blind packet: $key", (t) => {
  const section = sections.find((s) => s.spec.key === t.key)!;
  const packetPath = `${REVIEW_DIR}/answer-blind/${t.packetFile}`;
  const text = read(packetPath);

  it("is committed and equals a fresh regeneration (stale packet fails)", () => {
    expect(text).toBe(buildBlindPacket(section, t.packetId).text);
  });

  it("contains every item with full stem and every option, in order", () => {
    expect(section.data.questions).toHaveLength(40);
    let cursor = 0;
    for (const q of section.data.questions) {
      const at = text.indexOf(`\`${q.id}\``, cursor);
      expect(at).toBeGreaterThan(-1);
      cursor = at;
      expect(text).toContain(q.prompt);
      for (const o of q.options) expect(text).toContain(`- (${o.id}) ${o.text}`);
    }
  });

  it("has a blank reviewer decision table for every item and a blank reviewer identity table", () => {
    expect(text.match(/\| My selected option \| \|/g)).toHaveLength(40);
    expect(text.match(/\| Recommendation \(accept \/ revise \/ reject\) \| \|/g)).toHaveLength(40);
    expect(text).toMatch(/\| Reviewer name \| \|/);
    expect(text).toMatch(/\| Packet SHA-256 as received \| \|/);
  });

  it("scan: no answer-revealing content anywhere in the packet", () => {
    expect(scanBlindPacketForDisclosure(text, section.data.questions)).toEqual([]);
  });

  it("scan: explanations, skill labels and key markers are absent for every item", () => {
    const lowered = text.toLowerCase();
    for (const q of section.data.questions) {
      expect(lowered.includes(q.explanation.trim().toLowerCase())).toBe(false);
      expect(lowered.includes(q.metadata.skill.toLowerCase())).toBe(false);
    }
    expect(text).not.toMatch(/"answerKey"|answerKey|optionId/);
  });

  it("does not print declared difficulty labels as item metadata", () => {
    expect(text).not.toMatch(/difficulty:\s*(easy|medium|challenging)/i);
    expect(text).not.toMatch(/declared/i);
  });

  it("binds the exact source bytes and its own hash", () => {
    const manifest = JSON.parse(read(`${REVIEW_DIR}/answer-blind/packet-manifest.json`)) as {
      packets: Array<{ packetId: string; packetSha256: string; sourceFileSha256: string; sourceFile: string; itemHashes: Record<string, string>; itemCount: number }>;
    };
    const entry = manifest.packets.find((p) => p.packetId === t.packetId)!;
    expect(entry.packetSha256).toBe(packetHashOf(text));
    expect(text).toContain(`\`${entry.packetSha256}\``);
    expect(entry.sourceFileSha256).toBe(section.sha256);
    expect(entry.itemCount).toBe(40);
    expect(Object.keys(entry.itemHashes)).toHaveLength(40);
  });

  it("the scanner actually detects leaks (positive control)", () => {
    const q = section.data.questions[0];
    const leaky = (extra: string) => `${text}\n${extra}\n`;
    expect(scanBlindPacketForDisclosure(leaky(`Answer key: ${q.answerKey.optionId}`), section.data.questions).length).toBeGreaterThan(0);
    expect(scanBlindPacketForDisclosure(leaky(q.explanation), section.data.questions).length).toBeGreaterThan(0);
    expect(scanBlindPacketForDisclosure(leaky(`Solver value: 35, proof outcome: verified`), section.data.questions).length).toBeGreaterThan(0);
    expect(scanBlindPacketForDisclosure(leaky(`skill: ${q.metadata.skill}`), section.data.questions).length).toBeGreaterThan(0);
    const keyOpt = q.options.find((o) => o.id === q.answerKey.optionId)!;
    const marked = text.replace(`- (${keyOpt.id}) ${keyOpt.text}`, `- (${keyOpt.id}) ${keyOpt.text} (correct)`);
    expect(scanBlindPacketForDisclosure(marked, section.data.questions).some((f) => f.kind === "key_marker")).toBe(true);
  });

  it("scan ignores a forbidden word that is part of genuine question wording but still flags scaffolding", () => {
    const fake: DraftQuestion[] = [
      { id: "q", prompt: "Four marks for each correct answer.", options: [{ id: "a", text: "1" }], explanation: "n/a", answerKey: { optionId: "a" }, metadata: { difficulty: "easy", skill: "skill-label-x" } },
    ];
    expect(scanBlindPacketForDisclosure("Four marks for each correct answer.\n- (a) 1\n", fake)).toEqual([]);
    expect(scanBlindPacketForDisclosure("Four marks for each correct answer.\nThe correct answer is a\n", fake).length).toBeGreaterThan(0);
  });
});

describe("answer-key companions are separate and controlled", () => {
  it.each(targets)("$key companion lives in its own directory, names its paired packet hash, and carries distribution guidance", (t) => {
    const section = sections.find((s) => s.spec.key === t.key)!;
    const companionPath = `${REVIEW_DIR}/answer-key-companions/${t.companionFile}`;
    expect(existsSync(companionPath)).toBe(true);
    const packet = buildBlindPacket(section, t.packetId);
    const companion = read(companionPath);
    expect(companion).toContain(packet.packetSha256);
    expect(companion).toMatch(/CONTROLLED/);
    expect(companion).toMatch(/never be given to a reviewer/);
    for (const q of section.data.questions) expect(companion).toContain(`\`${q.id}\``);
    // The packet must not contain the companion's key table.
    expect(read(`${REVIEW_DIR}/answer-blind/${t.packetFile}`)).not.toContain("Stored key");
  });

  it("the internal owner packs no longer append an 'answer-withheld' section after the answers", () => {
    for (const f of ["NUMERICAL-40-OWNER-REVIEW.md", "MATHEMATICS-40-OWNER-REVIEW.md"]) {
      const md = read(`${REVIEW_DIR}/${f}`);
      expect(md).not.toMatch(/Answer-Withheld Independent Review Packet/i);
      expect(md).toMatch(/Never send it to a reviewer/);
      expect(md).not.toMatch(/Item \d+ \(`/);
    }
  });
});

describe("blind packets are not exposed to runtime routes or browser bundles", () => {
  const walk = (dir: string, out: string[] = []): string[] => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full, out);
      else if (/\.(ts|tsx|mts|js|mjs|json)$/.test(name)) out.push(full);
    }
    return out;
  };

  it("no runtime file under src/ (excluding tests) or public/ references the packet or companion directories", () => {
    const needles = ["answer-blind", "answer-key-companions", "REVIEWER-PACKET", "ANSWER-KEY-COMPANION"];
    const files = [...walk("src"), ...(existsSync("public") ? walk("public") : [])].filter((f) => !f.includes("/tests/") && !f.includes("\\tests\\"));
    for (const f of files) {
      const body = readFileSync(f, "utf8");
      for (const n of needles) expect(body.includes(n), `${f} references ${n}`).toBe(false);
    }
  });

  it("next.config.ts does not trace the packet or companion directories into any route", () => {
    const cfg = readFileSync("next.config.ts", "utf8");
    expect(cfg).not.toMatch(/answer-blind|answer-key-companions/);
    expect(cfg).not.toMatch(/docs\/reviews\/scholarship-2026-10-18\/\*\*/);
  });

  it("the forbidden-term list covers the disclosure vocabulary the review required", () => {
    const sample = ["answer key", "correct answer", "explanation", "solver", "recompute", "machine-verified", "matches key"];
    for (const s of sample) expect(BLIND_FORBIDDEN_TERMS.some((re) => re.test(s)), s).toBe(true);
  });
});
