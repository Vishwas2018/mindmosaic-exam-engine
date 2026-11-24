import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { duplicatePairs, replacementId } from "./bank-validation";
import { privatePath } from "./private-path";

test("private input cannot come from a linked worktree", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "agy-private-path-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const data = join(root, "data.json");
  await writeFile(data, "{}");
  assert.equal(await privatePath(data), data);

  const worktree = join(root, "worktree");
  await mkdir(worktree);
  await writeFile(join(worktree, ".git"), "gitdir: ../test-fixture");
  const inside = join(worktree, "data.json");
  await writeFile(inside, "{}");
  await assert.rejects(privatePath(inside), /Git worktrees/);
});

test("replacement identifiers stay distinct from legacy identifier families", () => {
  assert.equal(replacementId.test("vihaan-agy-mock-20261119-a-m01"), true);
  for (const id of ["vihaan-agy-m001", "vihaan-e500-m001", "vihaan-p01-m01"]) {
    assert.equal(replacementId.test(id), false);
  }
});

test("exact and parameter-only conflicts retain both identifiers", () => {
  const source = { id: "fixture-a", prompt: "Sample bucket 12 12 12 12" };
  const corpus = [
    { id: "fixture-b", prompt: "Sample bucket 12 12 12 12" },
    { id: "fixture-c", prompt: "Sample bucket 52 30 437 807" },
  ];
  assert.deepEqual(duplicatePairs([source], corpus), [
    { a: "fixture-a", b: "fixture-b", kind: "exact_stem", similarity: 1 },
    { a: "fixture-a", b: "fixture-c", kind: "parameter_only_variant", similarity: 1 },
  ]);
});

test("different operators are different questions, not duplicates", () => {
  const pairs = (a: string, b: string) => duplicatePairs([{ id: "op-a", prompt: a }], [{ id: "op-b", prompt: b }]);
  for (const [a, b] of [
    ["Compute 12 + 5.", "Compute 12 - 5."],
    ["Compute 12 + 5.", "Compute 12 − 5."],
    ["Compute 12 × 5.", "Compute 12 ÷ 5."],
    ["Is 12 < 5?", "Is 12 > 5?"],
    ["Is 12 ≤ 5?", "Is 12 ≥ 5?"],
    ["What is 7 − 3?", "What is 7 + 3?"],
    ["Evaluate -3 + 4.", "Evaluate 3 + 4."],
    ["Simplify 3/4 of 20.", "Simplify 3 of 20."],
    ["Find 15% of 80.", "Find 15 of 80."],
  ]) assert.deepEqual(pairs(a, b), [], `${a} vs ${b}`);
});

test("same operator with different numbers is still a parameter-only variant", () => {
  assert.deepEqual(
    duplicatePairs([{ id: "op-a", prompt: "Compute 12 + 5." }], [{ id: "op-b", prompt: "Compute 30 + 8." }]),
    [{ a: "op-a", b: "op-b", kind: "parameter_only_variant", similarity: 1 }],
  );
  assert.equal(duplicatePairs([{ id: "op-a", prompt: "Compute 12 − 5." }], [{ id: "op-b", prompt: "Compute 12 - 5." }])[0]?.kind, "exact_stem");
});

test("hyphenated words do not become subtraction", () => {
  assert.equal(duplicatePairs([{ id: "w-a", prompt: "A well-known rule applies to 5 items." }], [{ id: "w-b", prompt: "A well known rule applies to 5 items." }])[0]?.kind, "exact_stem");
});
