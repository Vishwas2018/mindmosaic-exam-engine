import { Client } from "pg";
const client = new Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:56322/postgres" });
await client.connect();
const res = await client.query(`
  select column_name, data_type, udt_name, is_nullable
  from information_schema.columns
  where table_schema='public' and table_name='item_versions'
  order by ordinal_position;
`);
for (const r of res.rows) console.log(r.column_name.padEnd(24), r.data_type.padEnd(20), r.udt_name, r.is_nullable);
await client.end();
