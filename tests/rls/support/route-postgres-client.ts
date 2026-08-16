import type { Client } from "pg";

/**
 * A minimal Supabase-JS-shaped adapter over a real `pg.Client`, for calling
 * the actual Next.js route handlers (`POST`/`GET` exports) against a real
 * local Postgres instead of a mocked one (Gate A item A9's HTTP-level tests).
 *
 * Not a PostgREST emulator — it implements exactly the handful of call
 * shapes `src/app/api/exam/session/**` and the modules they import
 * (`@/server/assessment/read-dispatch`, `@/server/assessment/target-session-writes`)
 * actually make: `auth.getUser()`, `.from("profiles"|"visible_sittings")` with
 * `.select().eq().single()/.maybeSingle()` and `.select().or().limit()`, and
 * `.rpc(name, params)`. `.rpc` is genuinely generic — Postgres resolves named
 * arguments (`p_foo => $1`) by name, not position, so one code path calls
 * every RPC these routes use without a per-function special case.
 *
 * The underlying connection is expected to already be impersonating
 * `authenticated` with the right `request.jwt.claims` (see `asRouteCaller`
 * below) — this class does not set role or claims itself, so a caller who
 * forgets to impersonate gets the same 401/RLS-denied failures a real
 * unauthenticated PostgREST request would.
 */
export class RoutePostgresClient {
  constructor(
    private readonly client: Client,
    private readonly userId: string | null,
  ) {}

  auth = {
    getUser: async () => ({
      data: { user: this.userId === null ? null : { id: this.userId } },
      error: null,
    }),
  };

  async rpc(name: string, params: Record<string, unknown> = {}): Promise<{ data: unknown; error: unknown }> {
    const entries = Object.entries(params);
    const args = entries.map(([key], index) => `${key} => $${index + 1}`).join(", ");
    /* node-pg does not auto-serialise a plain object to JSON text — every jsonb
       parameter these routes' RPCs take (p_config, p_responses) needs an
       explicit JSON.stringify, same as every raw-SQL RLS test in this suite
       does by hand. A JS array is passed through natively: node-pg formats it
       as a Postgres array literal itself, and the function signature (not this
       call) supplies the element type (uuid[]) for it to be parsed against. */
    const values = entries.map(([, value]) => {
      if (value === null || value === undefined) return null;
      if (Array.isArray(value)) return value;
      if (typeof value === "object") return JSON.stringify(value);
      return value;
    });
    try {
      const result = await this.client.query(`select public.${name}(${args}) as result`, values);
      return { data: result.rows[0]?.result ?? null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  from(table: string): TableBuilder {
    return new TableBuilder(this.client, table);
  }
}

interface Filter {
  readonly column: string;
  readonly op: "eq" | "gt" | "is" | "in" | "not_is";
  readonly value: unknown;
}

/**
 * Accumulates a query, executed only when awaited or a terminal method is
 * called — the same lazy-builder shape the real client has, which is what
 * lets route code chain `.select().eq().single()` without this class
 * needing to special-case every chain length.
 */
class TableBuilder implements PromiseLike<{ data: unknown; error: unknown }> {
  private columns = "*";
  private filters: Filter[] = [];
  private orExpr: string | null = null;
  private limitN: number | null = null;
  private singleMode: "one" | "maybe" | null = null;
  private upsertRow: Record<string, unknown> | null = null;
  private upsertConflictColumn: string | null = null;
  private orderColumn: string | null = null;
  private orderAscending = true;

  constructor(
    private readonly client: Client,
    private readonly table: string,
  ) {}

  select(columns: string): this {
    this.columns = columns;
    return this;
  }

  /** The one shape the legacy autosave route uses: a single-row upsert. */
  upsert(row: Record<string, unknown>, options: { onConflict: string }): this {
    this.upsertRow = row;
    this.upsertConflictColumn = options.onConflict;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, op: "eq", value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push({ column, op: "gt", value });
    return this;
  }

  /** `.is(col, null)` is the only shape any route here uses. */
  is(column: string, value: null): this {
    this.filters.push({ column, op: "is", value });
    return this;
  }

  /** `.not(col, "is", null)` — the negation read-dispatch.ts uses to mean "has a value". */
  not(column: string, operator: "is", value: null): this {
    if (operator !== "is") throw new Error(`RoutePostgresClient: unsupported .not() operator "${operator}"`);
    this.filters.push({ column, op: "not_is", value });
    return this;
  }

  in(column: string, values: readonly unknown[]): this {
    this.filters.push({ column, op: "in", value: values });
    return this;
  }

  /** PostgREST `.or("a.eq.X,b.eq.Y")` syntax — the one shape read-dispatch.ts uses. */
  or(expression: string): this {
    this.orExpr = expression;
    return this;
  }

  order(column: string, options: { ascending: boolean } = { ascending: true }): this {
    this.orderColumn = column;
    this.orderAscending = options.ascending;
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  single(): this {
    this.singleMode = "one";
    return this;
  }

  maybeSingle(): this {
    this.singleMode = "maybe";
    return this;
  }

  private buildUpsertSql(): { sql: string; values: unknown[] } {
    const row = this.upsertRow!;
    const columns = Object.keys(row);
    const values = columns.map((column) => {
      const value = row[column];
      if (value === null || value === undefined) return null;
      if (Array.isArray(value)) return value;
      if (typeof value === "object") return JSON.stringify(value);
      return value;
    });
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const updates = columns
      .filter((column) => column !== this.upsertConflictColumn)
      .map((column) => `${column} = excluded.${column}`);
    const sql =
      `insert into public.${this.table} (${columns.join(", ")}) values (${placeholders.join(", ")}) ` +
      `on conflict (${this.upsertConflictColumn}) do update set ${updates.join(", ")}`;
    return { sql, values };
  }

  private buildSql(): { sql: string; values: unknown[] } {
    const values: unknown[] = [];
    const where: string[] = [];

    for (const filter of this.filters) {
      switch (filter.op) {
        case "eq":
          values.push(filter.value);
          where.push(`${filter.column} = $${values.length}`);
          break;
        case "gt":
          values.push(filter.value);
          where.push(`${filter.column} > $${values.length}`);
          break;
        case "is":
          where.push(`${filter.column} is null`);
          break;
        case "not_is":
          where.push(`${filter.column} is not null`);
          break;
        case "in":
          values.push(filter.value);
          where.push(`${filter.column} = any($${values.length})`);
          break;
      }
    }

    if (this.orExpr !== null) {
      const clauses = this.orExpr.split(",").map((clause) => {
        const [column, op, ...rest] = clause.split(".");
        const value = rest.join(".");
        if (op !== "eq") throw new Error(`RoutePostgresClient: unsupported .or() operator "${op}"`);
        values.push(value);
        return `${column} = $${values.length}`;
      });
      where.push(`(${clauses.join(" or ")})`);
    }

    let sql = `select ${this.columns} from public.${this.table}`;
    if (where.length > 0) sql += ` where ${where.join(" and ")}`;
    if (this.orderColumn !== null) sql += ` order by ${this.orderColumn} ${this.orderAscending ? "asc" : "desc"}`;
    if (this.limitN !== null) sql += ` limit ${this.limitN}`;
    return { sql, values };
  }

  async execute(): Promise<{ data: unknown; error: unknown }> {
    const { sql, values } = this.upsertRow !== null ? this.buildUpsertSql() : this.buildSql();
    try {
      const result = await this.client.query(sql, values);
      if (this.singleMode === "one") {
        return result.rows[0] === undefined
          ? { data: null, error: { code: "PGRST116", message: "no rows" } }
          : { data: result.rows[0], error: null };
      }
      if (this.singleMode === "maybe") {
        return { data: result.rows[0] ?? null, error: null };
      }
      return { data: result.rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  then<TResult1, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

/**
 * Impersonates a signed-in user the way `tests/rls/fixtures.ts`'s
 * `asAuthenticated` does for the raw-SQL suites, on the SAME connection this
 * adapter wraps. Session-level (`set_config(..., false)`), not
 * transaction-local: each simulated HTTP "request" in a test is its own
 * auto-committed statement (no explicit `begin`), matching how PostgREST
 * actually issues one statement per request, so a `set local` scoped to a
 * transaction that ends immediately would not survive to the next call.
 */
export async function asRouteCaller(client: Client, userId: string): Promise<void> {
  await client.query("set role authenticated");
  await client.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({ sub: userId, role: "authenticated" }),
  ]);
}

export async function asRouteOwner(client: Client): Promise<void> {
  await client.query("reset role");
}
