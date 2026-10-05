/** Compare source-controlled runtime modes with the local database switches. Read-only. */
import { Client } from "pg";

import { PROGRAMME_PUBLICATION_MODES, publicationGateMode } from "@/features/content-governance/gate-config";

const connectionString =
  process.env.SUPABASE_DB_URL ??
  process.env.RLS_TEST_DB_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:56322/postgres";

const client = new Client({ connectionString });
await client.connect();
try {
  const result = await client.query<{ programme_id: string; enforced: boolean }>(
    "select programme_id, enforced from public.publication_gate_settings order by programme_id",
  );
  const database = new Map(result.rows.map((row) => [row.programme_id, row.enforced]));
  const allIds = new Set([...Object.keys(PROGRAMME_PUBLICATION_MODES), ...database.keys()]);

  const reportRows = [...allIds].sort().map((id) => {
    const tsMode = publicationGateMode(id);
    const dbRowPresent = database.has(id);
    const dbEnforced = database.get(id) ?? false;
    const dbEffectiveMode = dbEnforced ? "enforce" : "report";
    const agrees = tsMode === dbEffectiveMode;
    return {
      programmeId: id,
      tsMode,
      dbRow: dbRowPresent ? `enforced=${dbEnforced}` : "absent (effective: report)",
      effectiveDbMode: dbEffectiveMode,
      agrees,
    };
  });

  const disagreements = reportRows.filter((r) => !r.agrees);

  if (disagreements.length > 0) {
    console.error("\n❌ Publication gate mode mismatch between TypeScript and database:");
    console.table(
      disagreements.map((d) => ({
        "Programme ID": d.programmeId,
        "TypeScript Mode": d.tsMode,
        "Database Row": d.dbRow,
        "Effective DB Mode": d.effectiveDbMode,
      })),
    );
    throw new Error(
      `Publication gate mode differs between TypeScript and database for ${disagreements.length} programme(s): ${disagreements
        .map((d) => d.programmeId)
        .join(", ")}`,
    );
  }

  console.log(`\n✅ Publication gates agree for all ${reportRows.length} configured programme(s).`);
  console.log("   Effective gate mode equivalence: TS 'report' == DB row absent OR enforced=false; TS 'enforce' == DB row enforced=true.");
  if (reportRows.length > 0) {
    console.table(
      reportRows.map((r) => ({
        "Programme ID": r.programmeId,
        "TypeScript Mode": r.tsMode,
        "Database Setting": r.dbRow,
        "Effective Mode": r.tsMode,
      })),
    );
  } else {
    console.log("   Default behaviour with no DB rows and default TS modes: all programmes effectively in 'report' mode.");
  }
} finally {
  await client.end();
}
