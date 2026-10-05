/** Compare source-controlled runtime modes with the local database switches. Read-only. */
import { Client } from "pg";

import { PROGRAMME_PUBLICATION_MODES, publicationGateMode } from "@/features/content-governance/gate-config";

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) throw new Error("SUPABASE_DB_URL is required for the publication gate agreement check.");

const client = new Client({ connectionString });
await client.connect();
try {
  const result = await client.query<{ programme_id: string; enforced: boolean }>(
    "select programme_id, enforced from public.publication_gate_settings order by programme_id",
  );
  const database = new Map(result.rows.map((row) => [row.programme_id, row.enforced]));
  const ids = new Set([...Object.keys(PROGRAMME_PUBLICATION_MODES), ...database.keys()]);
  const disagreements = [...ids].sort().filter((id) =>
    (publicationGateMode(id) === "enforce") !== (database.get(id) ?? false));
  if (disagreements.length) {
    throw new Error(`Publication gate mode differs between TypeScript and database: ${disagreements.join(", ")}`);
  }
  console.log(`Publication gates agree for ${ids.size} configured programme(s); omitted programmes report.`);
} finally {
  await client.end();
}
