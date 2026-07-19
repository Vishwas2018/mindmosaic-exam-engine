import { Client } from "pg";

// Matches the `db.port` in supabase/config.toml. Shifted off Supabase's
// 543xx defaults because other local Supabase stacks may already be
// running on this machine, and because 55271-55370 falls inside a Windows
// TCP excluded-port range on at least one dev box.
const DEFAULT_DB_URL = "postgresql://postgres:postgres@127.0.0.1:56322/postgres";

export function dbUrl(): string {
  return process.env.RLS_TEST_DB_URL ?? DEFAULT_DB_URL;
}

export async function connect(): Promise<Client> {
  const client = new Client({ connectionString: dbUrl() });
  await client.connect();
  return client;
}
