import "server-only";

import { Client } from "pg";

import { answerKeySchema, type AnswerKey } from "@/schemas/question.schema";

/**
 * THE CONTENT-PLATFORM ANSWER WRITER (spec §9.3.1; ADR-006 Amendment A). The
 * write-side twin of src/server/scoring/answer-access.ts — that module is the
 * one sanctioned reader of `item_answer_versions`; this is the one sanctioned
 * writer. Everything that inserts an answer key, grading rules, rubric or
 * private explanation happens between here and the bottom of this file, and
 * nothing about that key's content leaves: the function below returns void.
 *
 * WHAT THIS MODULE HOLDS THAT NOTHING ELSE MAY.
 * `CONTENT_ANSWER_WRITER_DB_URL`, the credential for
 * `mindmosaic_content_answer_writer` (20260902090000). It is not
 * `service_role`, not `mindmosaic_scoring`, holds no `BYPASSRLS`, and its
 * entire privilege set is one grant: INSERT on `item_answer_versions`. No
 * SELECT — this module never reads back what it wrote. That the credential
 * appears in no other file is asserted by
 * src/tests/unit/scoring-module-boundary.test.ts, the same "automated check
 * rather than convention" §9.3.1 requires of the read side.
 *
 * WHY A SEPARATE ROLE FROM mindmosaic_scoring. That role is SELECT-only on
 * this table by design (20260812110000) — widening it to also insert would
 * let the one credential trusted to read every learner's pinned answer also
 * mint new ones. Read and write stay two independently auditable
 * capabilities, each in its own one-file module, each with its own
 * least-privilege role.
 *
 * WHY THIS LIVES UNDER src/server/scoring/. Not because it scores anything —
 * because item_answer_versions is scoring's table, and the spec's boundary is
 * about the table, not the feature that happens to be writing to it today.
 * Keeping both modules that touch this table in one directory is what makes
 * "does anything else touch it" a `readdir` away rather than a grep across
 * the whole tree.
 */

function writerConnectionString(): string {
  const url = process.env.CONTENT_ANSWER_WRITER_DB_URL;
  if (!url) {
    throw new Error(
      "CONTENT_ANSWER_WRITER_DB_URL is not set. Publishing an answer requires the dedicated " +
        "mindmosaic_content_answer_writer credential (spec §9.3.1); it deliberately cannot " +
        "fall back to any other.",
    );
  }
  return url;
}

/** The one row this module ever inserts. */
export interface AnswerVersionInsert {
  readonly itemVersionId: string;
  readonly answerKey: AnswerKey;
  /** Opaque to this module; stored as-is. */
  readonly gradingRules: unknown;
  /** Opaque to this module; stored as-is. Null when the item has no rubric. */
  readonly rubric: unknown;
  readonly privateExplanation: string | null;
  readonly gradingSchemaVersion: number;
}

/**
 * Inserts one answer version. Insert-only: `item_answer_versions_immutable`
 * (20260812090000) rejects every update regardless of role, so there is no
 * update path to expose here, and the writer role holds no UPDATE grant.
 *
 * `answerKey` is parsed rather than trusted, the same defence
 * answer-access.ts applies on the read side — the caller has almost always
 * already validated it as part of a larger revision, but this module's own
 * guarantee should not depend on that.
 *
 * Returns void: nothing about the row just written — not the key, not the
 * rubric, not the explanation — comes back out.
 */
export async function insertAnswerVersion(input: AnswerVersionInsert): Promise<void> {
  const answerKey = answerKeySchema.parse(input.answerKey);

  const client = new Client({ connectionString: writerConnectionString() });
  /* An 'error' event with no listener on a pg Client is an uncaught exception,
     which in a server process is a crash rather than a failed request. */
  client.on("error", () => undefined);
  await client.connect();

  try {
    await client.query(
      `insert into public.item_answer_versions
         (item_version_id, answer_key, grading_rules, rubric, private_explanation, grading_schema_version)
       values ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5, $6)`,
      [
        input.itemVersionId,
        JSON.stringify(answerKey),
        JSON.stringify(input.gradingRules ?? {}),
        input.rubric === null || input.rubric === undefined ? null : JSON.stringify(input.rubric),
        input.privateExplanation,
        input.gradingSchemaVersion,
      ],
    );
  } finally {
    await client.end();
  }
}
