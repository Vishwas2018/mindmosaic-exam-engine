import { Client } from "pg";
const client = new Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:56322/postgres" });
await client.connect();
const res = await client.query(`
  select c.relname as table_name, p.polname, p.polcmd,
    pg_get_expr(p.polqual, p.polrelid) as using_expr,
    pg_get_expr(p.polwithcheck, p.polrelid) as check_expr
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('profiles','classes','class_students','assignments','assignment_students','parent_children','subscriptions','exam_attempts','exam_sessions','exam_responses')
  order by c.relname, p.polcmd;
`);
for (const row of res.rows) {
  console.log(row.table_name.padEnd(22), row.polcmd, "  ", row.polname);
}

const rel = await client.query(`
  select c.relname, c.relkind from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind in ('r','p') order by 1;
`);
console.log("\nBase tables:");
for (const r of rel.rows) console.log(" ", r.relname);
await client.end();
