import { Client } from "pg";

const client = new Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:56322/postgres" });
await client.connect();

const STUDENT = "88880000-0000-0000-0000-0000000000a1";
await client.query("set role authenticated");
await client.query("select set_config('request.jwt.claims', $1, false)", [
  JSON.stringify({ sub: STUDENT, role: "authenticated" }),
]);

const config = {
  yearLevel: 5,
  examStyle: "a9_http_style",
  subject: "numeracy",
  questionCount: 3,
  timing: "untimed",
};

try {
  const result = await client.query(
    `select public.create_assessment_session(p_config => $1, p_idempotency_key => $2) as result`,
    [JSON.stringify(config), "debug-key-1"],
  );
  console.log("OK", result.rows[0]);
} catch (e) {
  console.error("ERROR", e);
}

await client.end();
