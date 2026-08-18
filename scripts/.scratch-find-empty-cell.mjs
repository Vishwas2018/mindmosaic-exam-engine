import { Client } from "pg";
const client = new Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:56322/postgres" });
await client.connect();
const res = await client.query(`
  select distinct source_exam_style, source_year_level, source_subject
  from public.item_versions
  where source_exam_style = 'icas_style' and source_subject = 'numeracy'
  order by source_year_level
`);
console.log(res.rows);
await client.end();
