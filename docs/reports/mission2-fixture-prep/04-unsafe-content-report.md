# Unsafe Content & Publication Safeguards — Mission 2 Fixture Prep

Status: **prep-only, non-authoritative reference**. This document exists to be checked *before*
any future Mission 2 session copies anything further out of `_HARVEST` into this repository.

## 1. Blanket rule: no harvested question content may ever be published directly

Every one of the 302 unique harvested questions (and the CSV harvest's rows) is, by definition,
donor draft content — `origin: "ai_generated"` or `"manual"` in the donor's own terms, never
`original_seed`. Per Shared Governance content rules, harvested prose must never be copied or
closely paraphrased into the production bank under any circumstances, regardless of the donor's
own `status`/`approvalStatus` fields (see `03-legacy-ingestion-requirements.md` §7 for why those
fields carry zero weight here). This is not a per-file judgement call — it is the correct
classification (`publicationSuitability: "never_verbatim_untrusted_donor_content"`) for all 305
content-bearing records in `harvest-inventory.json`, without exception.

**This prep branch has copied a bounded number of real harvest excerpts into
`calibration-corpus-content.json`** (24 real harvest questions, reproduced in full, needed to
make specific labelled-pair fixtures concrete and testable) and **`harvest-inventory.json`
contains no reproduced prose at all** (metadata/flags only — prompts, passages and explanations
are never copied into the inventory). The 24 excerpts are:

- Reproduced only where a real (non-synthetic) calibration pair required them.
- Single-question length (the longest is a ~700-character reading passage).
- Stored only under `src/tests/fixtures/` (test data), never under `src/content/questions/`
  (the production bank) or anywhere that ships to users.
- Explicitly labelled `"source": "harvest"` in the content map, distinguishing them from the 24
  `"source": "synthetic_for_calibration"` entries alongside them.

This is the correct, minimal use of donor material the task allows — using it as *test fixtures
for a future duplicate-detection gate*, never as content. **No harvested prose appears anywhere
in `src/content/questions/` and none was added by this branch.**

## 2. Hygiene finding: the CSV harvest embeds a real personal email address

`_HARVEST/15-csv-import-seed/fixtures/*.csv` (all four files) use `vishwas.joshi01@gmail.com`
(the repository maintainer's own real email) as the `reviewed_by` value on every single data row,
and `claude-haiku-4-5` as `authored_by`. This is the maintainer's own project and own address —
not a third party's private data — but it is still a hygiene issue worth flagging plainly: a real
personal email address embedded in committed test fixture data is something most projects
deliberately avoid (search-engine indexing, scraping, accidental reuse elsewhere), and there is no
functional reason the fixture needs a real address rather than a placeholder
(`reviewer@example.com`).

**Action taken on this branch:** `calibration-corpus-content.json`'s three CSV-derived entries
(`csv-valid-mixed-002`, `csv-reading-comp-y5-001-q1`, `csv-reading-comp-y5-001-q2`) deliberately
omit the `authored_by`/`reviewed_by` columns entirely — only `slug`, `type`, `topicSlug`,
`yearLevels`, `difficulty`, `groupSlug`/`groupPosition` (where relevant) and the parsed
`content_data_json` payload were carried over. Verified by grep across this branch's fixtures and
docs: zero occurrences of the email address or the string `@gmail.com` anywhere in
`src/tests/fixtures/` or `docs/reports/mission2-fixture-prep/`.

**Recommendation for any future work that touches the raw CSV harvest directly:** scrub or
placeholder these two columns before copying any further CSV rows, and consider flagging it
upstream in `00-LEGACY_REPO_REUSE_AUDIT.md` or equivalent so it doesn't get re-copied by a
different session that doesn't have this finding in context.

## 3. Schema-level risk: raw SVG / opaque-image visual types

`_HARVEST/03-question-banks/schemas/visual-asset.schema.json` permits `type: "image"`,
`type: "svg"`, and a free-string `svgContent` field on **any** asset type — all three are exactly
what content rules forbid ("Visuals are structured deterministic JSON only — no raw SVG strings,
screenshots, or opaque images"). **Empirically, across all 404 harvest question files, zero assets
use `type: "image"` or `type: "svg"`, and zero populate `svgContent`** (confirmed by the
mechanical inventory). The risk is real but not currently realised in the harvested corpus.

**Flag for the future:** this is a schema-level trap, not a corpus-level one — a future
`manual_external` candidate (something pasted from ChatGPT/Qwen, which have no reason to know
this repository's visual-safety rules) could easily produce a raw `<svg>` string or an
`type: "image"` asset with a `url` pointing at an external host. Any future ingestion or manual-
external intake path must reject these outright, not attempt to convert them — there is no safe
automatic conversion from an opaque raster image or a free-form SVG string into the trusted
schema's typed `labelled_svg`/`hotspot_svg` primitive shapes; that always requires a human or LLM
to re-author the visual as typed elements. See `03-legacy-ingestion-requirements.md` §5.

## 4. Originality/copyright: an honest limitation of this pass

Shared Governance forbids copying or closely paraphrasing official NAPLAN/ICAS material,
textbooks, worksheets, or other published content. This prep pass checked the harvest against the
donor's own copyright blocklist (`02-question-factory/question-factory/qa/contentQa.mjs`'s
`COPYRIGHT_BLOCKLIST`: Harry Potter, Pokémon, Star Wars, and similar unambiguous third-party IP
terms) by re-running that tool read-only against the 302-question `starter-bank` — **zero hits**.

**This is not the same as verifying original-content compliance.** A blocklist of proper nouns
catches only the most blatant case (a generated question that names a copyrighted character). It
cannot detect close paraphrase of an actual released NAPLAN or ICAS test item, because no
reference corpus of real released test content was available to compare against during this pass,
and building or licensing one is outside this prep task's scope. **This must be stated plainly
rather than implied away:** neither this document nor the donor's own blocklist scan constitutes
a compliance proof. Before any harvested-content-*inspired* (never copied) question is authored
fresh and published, a human familiar with the actual NAPLAN/ICAS released-item corpora should
spot-check for unintentional closeness — this prep pass cannot substitute for that judgement.

## 5. Material that must never be published directly — summary flag list

| Material | Why | Where it lives (if referenced at all by this branch) |
|---|---|---|
| Any of the 302 unique harvested questions, verbatim | Untrusted donor draft; `origin` is never `original_seed` | 24 excerpts in `calibration-corpus-content.json`, test-fixture use only |
| `review-queue.json`'s `reviewerComments`/`approvalStatus` fields | Describes a defunct donor review process with no verifiable evidence chain in this repository | Not reproduced anywhere in this branch |
| CSV harvest `authored_by`/`reviewed_by` columns | Real personal email address (see §2) | Deliberately omitted from every fixture on this branch |
| Any harvest asset with `type: "svg"`/`"image"` or populated `svgContent` | Forbidden raw/opaque visual (see §3) | None exist in the corpus today; flagged as a future-intake risk |
| Harvest content close to real released NAPLAN/ICAS material | Cannot be ruled out by this pass (see §4) | N/A — applies to any future *original* content inspired by harvest patterns, not to fixture reproduction itself |

## 6. Confirmation

Grep across `src/tests/fixtures/question-factory/mission2-calibration/` and
`docs/reports/mission2-fixture-prep/` for the maintainer's email address and the literal string
`@gmail.com`: **zero matches.** No file under `src/content/questions/` (the production bank) was
created, modified, or touched by this branch. `npm run validate:questions` /
`npm run check:answers` (run as part of the verification gate — see the final report) confirm the
production bank's 100 questions remain exactly as they were before this branch existed.
