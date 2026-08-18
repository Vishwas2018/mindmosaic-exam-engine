import { Client } from "pg";
const client = new Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:56322/postgres" });
await client.connect();
const res = await client.query(`
  select table_name, grantee, string_agg(distinct privilege_type, ',' order by privilege_type) as privs
  from information_schema.role_table_grants
  where table_schema='public' and grantee in ('anon','authenticated')
  group by table_name, grantee
  order by table_name, grantee;
`);
for (const row of res.rows) {
  console.log(row.table_name.padEnd(35), row.grantee.padEnd(14), row.privs);
}
await client.end();
