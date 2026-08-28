/**
 * CLI runner for Australian curriculum manifest validation and import.
 *
 * Usage:
 *   npx tsx scripts/curriculum-import.mts --manifest <path> [--mode <validate_only|dry_run|apply>] [--json] [--db-url <url>]
 */

import "./lib/allow-server-only.mts";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import {
  CurriculumImportError,
  importCurriculumManifest,
  type ImportMode,
} from "@/server/curriculum";

const options = {
  manifest: { type: "string" as const, short: "m" },
  mode: { type: "string" as const, default: "dry_run" },
  "validate-only": { type: "boolean" as const },
  "dry-run": { type: "boolean" as const },
  apply: { type: "boolean" as const },
  json: { type: "boolean" as const },
  "db-url": { type: "string" as const },
  help: { type: "boolean" as const, short: "h" },
};

const { values } = parseArgs({
  options,
  allowPositionals: true,
});

if (values.help || !values.manifest) {
  console.log(`
MindMosaic Curriculum Import CLI

Options:
  -m, --manifest <path>     Path to the curriculum JSON manifest (required)
      --mode <mode>         Import mode: validate_only | dry_run | apply (default: dry_run)
      --validate-only       Alias for --mode validate_only
      --dry-run             Alias for --mode dry_run
      --apply               Alias for --mode apply
      --json                Emit machine-readable JSON output
      --db-url <url>        Database connection string override
  -h, --help                Show this help message

Examples:
  npx tsx scripts/curriculum-import.mts --manifest ./manifests/au-ac9.json --dry-run
  npx tsx scripts/curriculum-import.mts --manifest ./manifests/au-ac9.json --apply --json
`);
  process.exit(values.help ? 0 : 1);
}

let mode: ImportMode = "dry_run";
if (values["validate-only"]) {
  mode = "validate_only";
} else if (values.apply) {
  mode = "apply";
} else if (values["dry-run"]) {
  mode = "dry_run";
} else if (values.mode === "validate_only" || values.mode === "dry_run" || values.mode === "apply") {
  mode = values.mode;
} else {
  console.error(`Invalid mode '${values.mode}'. Expected 'validate_only', 'dry_run', or 'apply'.`);
  process.exit(1);
}

const manifestPath = resolve(process.cwd(), values.manifest);
let rawContent: string;
try {
  rawContent = readFileSync(manifestPath, "utf-8");
} catch (err) {
  console.error(`Failed to read manifest at '${manifestPath}': ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

let parsedJson: unknown;
try {
  parsedJson = JSON.parse(rawContent);
} catch (err) {
  console.error(`Invalid JSON in manifest at '${manifestPath}': ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

async function run() {
  try {
    const report = await importCurriculumManifest(parsedJson, {
      mode,
      connectionString: values["db-url"],
    });

    if (values.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(`\nCurriculum Import Report (${report.mode}):`);
      console.log(`Manifest: ${report.manifestKey}`);
      console.log(`Success:  ${report.success ? "YES" : "NO"}`);
      console.log(`Duration: ${report.durationMs}ms`);
      console.log(`Entities:`);
      console.log(`  - Evidence:         ${report.counts.evidenceInserted} inserted, ${report.counts.evidenceSkipped} skipped`);
      console.log(`  - Sources:          ${report.counts.sourcesInserted} inserted, ${report.counts.sourcesSkipped} skipped`);
      console.log(`  - Releases:         ${report.counts.releasesInserted} inserted, ${report.counts.releasesSkipped} skipped`);
      console.log(`  - Nodes:            ${report.counts.nodesInserted} inserted, ${report.counts.nodesSkipped} skipped`);
      console.log(`  - Applicabilities:  ${report.counts.applicabilitiesInserted} inserted, ${report.counts.applicabilitiesSkipped} skipped`);
      console.log(`  - Crosswalks:       ${report.counts.crosswalksInserted} inserted, ${report.counts.crosswalksSkipped} skipped`);
      console.log(`  - Alignments:       ${report.counts.taxonomyAlignmentsInserted} inserted, ${report.counts.taxonomyAlignmentsSkipped} skipped`);
      console.log(`  - Review Events:    ${report.counts.reviewEventsInserted} inserted, ${report.counts.reviewEventsSkipped} skipped`);
      if (report.warnings.length > 0) {
        console.log(`Warnings:`);
        for (const w of report.warnings) console.log(`  - ${w}`);
      }
    }
  } catch (err) {
    if (values.json) {
      console.log(
        JSON.stringify(
          {
            success: false,
            mode,
            error: err instanceof Error ? err.message : String(err),
            details: err instanceof CurriculumImportError ? err.details : undefined,
          },
          null,
          2,
        ),
      );
    } else {
      console.error(`\nImport failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exit(1);
  }
}

void run();
