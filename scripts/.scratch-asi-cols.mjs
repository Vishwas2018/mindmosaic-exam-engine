import { Client } from "pg";
const client = new Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:56322/postgres" });
await client.connect();
const res = await client.query(`
  select column_name, data_type, is_nullable, column_default
  from information_schema.columns
  where table_schema='public' and table_name='assessment_session_items'
  order by ordinal_position;
`);
for (const r of res.rows) console.log(r.column_name.padEnd(24), r.data_type.padEnd(14), r.is_nullable, r.column_default ?? "");
await client.end();
