import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connect } from "./db";
import { asAuthenticated, PARENT_C, seed, STUDENT_A } from "./fixtures";

let client: Client;

const TABLES = [
  "curriculum_jurisdictions",
  "curriculum_licence_evidence",
  "curriculum_sources",
  "curriculum_releases",
  "curriculum_nodes",
  "curriculum_applicabilities",
  "curriculum_crosswalks",
  "curriculum_taxonomy_alignments",
  "curriculum_review_events",
] as const;

const HASH = "1".repeat(64);
const EVIDENCE_ID = "20000000-0000-4000-8000-000000000001";
const SOURCE_ID = "20000000-0000-4000-8000-000000000002";
const RELEASE_ID = "20000000-0000-4000-8000-000000000003";
const NODE_ID = "20000000-0000-4000-8000-000000000004";

async function savepoint(body: () => Promise<void>): Promise<void> {
  await client.query("savepoint curriculum_sp");
  try {
    await body();
  } finally {
    await client.query("rollback to savepoint curriculum_sp");
    await client.query("release savepoint curriculum_sp");
  }
}

async function insertFoundation(options: { permitsStorage?: boolean; permitsDisplay?: boolean } = {}) {
  await client.query(
    `insert into public.curriculum_licence_evidence
       (id, evidence_key, licence_id, evidence_url, retrieved_at, evidence_fingerprint,
        permits_storage, permits_display)
     values ($1, 'synthetic-evidence', 'synthetic-licence', 'https://example.invalid/evidence',
             now(), $2, $3, $4)`,
    [EVIDENCE_ID, HASH, options.permitsStorage ?? false, options.permitsDisplay ?? false],
  );
  await client.query(
    `insert into public.curriculum_sources
       (id, source_key, authority_code, authority_name, jurisdiction_code, school_sectors,
        title, source_url, retrieved_at, source_fingerprint, licence_evidence_id,
        licence_id, licence_name, official_text_access)
     values ($1, 'synthetic-vic', 'synthetic-authority', 'Synthetic authority', 'VIC',
             array['government','catholic'], 'Synthetic source',
             'https://example.invalid/source', now(), $2, $3, 'synthetic-licence',
             'Synthetic licence', $4)`,
    [SOURCE_ID, HASH, EVIDENCE_ID, options.permitsStorage ? "store_only" : "metadata_only"],
  );
  await client.query(
    `insert into public.curriculum_releases
       (id, release_key, source_id, framework_scope, jurisdiction_code, school_sectors,
        title, release_version, source_fingerprint)
     values ($1, 'synthetic-vic-v1', $2, 'state', 'VIC', array['government'],
             'Synthetic release', 'SYN-1', $3)`,
    [RELEASE_ID, SOURCE_ID, HASH],
  );
  await client.query(
    `insert into public.curriculum_nodes
       (id, release_id, node_key, node_kind, official_code, label)
     values ($1, $2, 'syn-vic-l3-m-n01', 'content_descriptor', 'SYN-VIC-L3-M-N01',
             'Synthetic descriptor')`,
    [NODE_ID, RELEASE_ID],
  );
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("curriculum authoritative access", () => {
  it("denies authenticated learners direct reads and writes", async () => {
    await asAuthenticated(client, STUDENT_A);
    for (const table of TABLES) {
      await savepoint(async () => {
        await expect(client.query(`select 1 from public.${table} limit 1`)).rejects.toMatchObject({
          code: "42501",
        });
      });
    }
  });

  it("allows owner imports and rejects later mutation", async () => {
    await insertFoundation();
    await expect(
      client.query(`update public.curriculum_nodes set label = 'changed' where id = $1`, [NODE_ID]),
    ).rejects.toMatchObject({ code: "MM303" });
  });
});

describe("curriculum provenance and release integrity", () => {
  it("rejects official text when evidence does not permit storage", async () => {
    await insertFoundation();
    await expect(
      client.query(
        `insert into public.curriculum_nodes
           (release_id, node_key, node_kind, label, official_text,
            official_text_licence_id, official_text_attribution)
         values ($1, 'syn-text', 'content_descriptor', 'Synthetic', 'Restricted text',
                 'synthetic-licence', 'Synthetic attribution')`,
        [RELEASE_ID],
      ),
    ).rejects.toMatchObject({ code: "MM301" });
  });

  it("rejects release jurisdiction and sector drift", async () => {
    await insertFoundation();
    await savepoint(async () => {
      await expect(
        client.query(
          `insert into public.curriculum_releases
             (release_key, source_id, framework_scope, jurisdiction_code, school_sectors,
              title, release_version, source_fingerprint)
           values ('bad-jurisdiction', $1, 'state', 'NSW', array['government'], 'Bad', '1', $2)`,
          [SOURCE_ID, HASH],
        ),
      ).rejects.toMatchObject({ code: "MM302" });
    });
    await expect(
      client.query(
        `insert into public.curriculum_releases
           (release_key, source_id, framework_scope, jurisdiction_code, school_sectors,
            title, release_version, source_fingerprint)
         values ('bad-sector', $1, 'state', 'VIC', array['independent'], 'Bad', '1', $2)`,
        [SOURCE_ID, HASH],
      ),
    ).rejects.toMatchObject({ code: "MM302" });
  });
});

describe("curriculum review transitions", () => {
  it("enforces draft to in_review to one terminal decision", async () => {
    await insertFoundation();
    await client.query(
      `insert into public.curriculum_review_events (entity_kind, entity_id, status)
       values ('node', $1, 'draft')`,
      [NODE_ID],
    );
    await client.query(
      `insert into public.curriculum_review_events (entity_kind, entity_id, status)
       values ('node', $1, 'in_review')`,
      [NODE_ID],
    );
    await client.query(
      `insert into public.curriculum_review_events (entity_kind, entity_id, status, reviewer_id)
       values ('node', $1, 'approved', 'reviewer@example.invalid')`,
      [NODE_ID],
    );
    await expect(
      client.query(
        `insert into public.curriculum_review_events (entity_kind, entity_id, status)
         values ('node', $1, 'draft')`,
        [NODE_ID],
      ),
    ).rejects.toMatchObject({ code: "MM304" });
  });

  it("rejects skipped transitions", async () => {
    await insertFoundation();
    await expect(
      client.query(
        `insert into public.curriculum_review_events (entity_kind, entity_id, status, reviewer_id)
         values ('node', $1, 'approved', 'reviewer@example.invalid')`,
        [NODE_ID],
      ),
    ).rejects.toMatchObject({ code: "MM304" });
  });
});

describe("learner and offering constraints", () => {
  it("accepts Years 1 and 12 and rejects Year 13", async () => {
    await client.query(`update public.profiles set year_level = 1 where id = $1`, [STUDENT_A]);
    await client.query(`update public.profiles set year_level = 12 where id = $1`, [STUDENT_A]);
    await expect(
      client.query(`update public.profiles set year_level = 13 where id = $1`, [STUDENT_A]),
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("requires paired preferences on students only", async () => {
    await client.query(
      `update public.profiles
          set curriculum_jurisdiction_code = 'VIC', curriculum_school_sector = 'government'
        where id = $1`,
      [STUDENT_A],
    );
    await savepoint(async () => {
      await expect(
        client.query(
          `update public.profiles set curriculum_school_sector = null where id = $1`,
          [STUDENT_A],
        ),
      ).rejects.toMatchObject({ code: "23514" });
    });
    await expect(
      client.query(
        `update public.profiles
            set curriculum_jurisdiction_code = 'VIC', curriculum_school_sector = 'government'
          where id = $1`,
        [PARENT_C],
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("rejects an offering region outside the registered vocabulary", async () => {
    await expect(
      client.query(`update public.programme_offerings set region = 'victoria' where id = (select id from public.programme_offerings limit 1)`),
    ).rejects.toMatchObject({ code: "23514" });
  });
});
