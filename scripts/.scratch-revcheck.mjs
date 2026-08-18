import { Client } from "pg";
const client = new Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:56322/postgres" });
await client.connect();
const r1 = await client.query(`select count(*) from public.publication_manifests where revision = 0`);
console.log("publication_manifests.revision = 0 count:", r1.rows[0].count);
const r2 = await client.query(`
  select count(*) from public.publication_manifests m
  where exists (
    select 1 from jsonb_array_elements(m.review_evidence) e
    where (e->>'reviewBoundRevision')::int = 0
  )`);
console.log("manifests with reviewBoundRevision=0 in review_evidence:", r2.rows[0].count);
const r3 = await client.query(`select min(revision), max(revision) from public.item_versions`);
console.log("item_versions revision range:", r3.rows[0]);
await client.end();
