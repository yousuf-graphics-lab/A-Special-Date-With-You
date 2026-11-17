/**
 * Database layer.
 *
 * Production (Supabase / any hosted Postgres):
 *   DATABASE_URL=postgresql://...      (use the pooled connection string)
 *
 * Local development and preview:
 *   With no DATABASE_URL the app boots an embedded PostgreSQL (PGlite) inside
 *   the Next.js server and runs the exact same SQL migrations. Real queries,
 *   real persistence on disk, no mocks.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { Pool, type PoolClient } from "pg";

export type Queryable = {
  query: <T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: T[]; rowCount: number | null }>;
};

type Backend = Queryable & {
  mode: "postgres" | "pglite";
  /** Run a script of several statements (schema migrations). */
  exec: (sql: string) => Promise<void>;
};

const globalForDb = globalThis as unknown as {
  __fsd_backend?: Promise<Backend>;
  __fsd_pg_pool?: Pool;
};

export const isProduction = () => process.env.NODE_ENV === "production";

/**
 * In production a hosted database is required — serverless filesystems are
 * ephemeral, so quietly falling back to an embedded database would lose
 * Samiya's answers. Without DATABASE_URL we surface a clear message instead.
 */
export function databaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL) || !isProduction();
}

export const databaseMode = (): "postgres" | "pglite" =>
  process.env.DATABASE_URL ? "postgres" : "pglite";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");
const PGLITE_DIR = process.env.PGLITE_DIR
  ? path.resolve(process.cwd(), process.env.PGLITE_DIR)
  : path.join(process.cwd(), ".data", "pglite");

function migrations(): { name: string; sql: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => ({
      name: file,
      sql: readFileSync(path.join(MIGRATIONS_DIR, file), "utf8"),
    }));
}

/**
 * Applies migrations once, in filename order, and remembers what has run.
 * Every statement is also written idempotently, so this is safe on a fresh
 * database and on one created by an earlier version of the app.
 */
async function runMigrations(db: Queryable & { exec: (sql: string) => Promise<void> }) {
  await db.exec(`
    create table if not exists schema_migrations (
      name       text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const applied = new Set(
    (await db.query<{ name: string }>("select name from schema_migrations")).rows.map(
      (row) => row.name,
    ),
  );

  for (const migration of migrations()) {
    if (applied.has(migration.name)) continue;
    await db.exec(migration.sql);
    await db.query("insert into schema_migrations (name) values ($1) on conflict do nothing", [
      migration.name,
    ]);
    console.log(`[db] applied ${migration.name}`);
  }
}

async function createPostgresBackend(): Promise<Backend> {
  const pool =
    globalForDb.__fsd_pg_pool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.PG_POOL_MAX ?? 5),
      ssl:
        process.env.DATABASE_SSL === "false"
          ? undefined
          : { rejectUnauthorized: false },
    });
  globalForDb.__fsd_pg_pool = pool;
  pool.on("error", (error) => console.error("[db] pool error", error.message));

  const run = async <T>(text: string, params?: unknown[]) => {
    const result = await pool.query(text, params as unknown[] | undefined);
    return { rows: result.rows as T[], rowCount: result.rowCount };
  };

  const exec = async (sql: string) => {
    await pool.query(sql);
  };

  await run("select 1");
  await runMigrations({ query: run, exec });
  return { mode: "postgres", query: run, exec };
}

async function createPgliteBackend(): Promise<Backend> {
  const { PGlite } = await import("@electric-sql/pglite");
  if (!existsSync(PGLITE_DIR)) mkdirSync(PGLITE_DIR, { recursive: true });
  const client = await PGlite.create({ dataDir: PGLITE_DIR });

  const run = async <T>(text: string, params?: unknown[]) => {
    const result = await client.query<T>(text, params as unknown[] | undefined);
    return {
      rows: result.rows as T[],
      rowCount: result.affectedRows ?? result.rows.length,
    };
  };

  // A tiny advisory-lock style guard so concurrent cold starts do not both
  // attempt to create the schema.
  const exec = async (sql: string) => {
    await client.exec(sql);
  };

  await client.exec("select pg_advisory_lock(918273645)");
  try {
    await runMigrations({ query: run, exec });
  } finally {
    await client.exec("select pg_advisory_unlock(918273645)");
  }
  return { mode: "pglite", query: run, exec };
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "DATABASE_URL is not configured. Add the Supabase Postgres connection string to the environment.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

export function getBackend(): Promise<Backend> {
  if (!databaseConfigured()) return Promise.reject(new DatabaseNotConfiguredError());
  if (!globalForDb.__fsd_backend) {
    globalForDb.__fsd_backend = (async () => {
      const backend =
        databaseMode() === "postgres"
          ? await createPostgresBackend()
          : await createPgliteBackend();
      console.log(`[db] ready (${backend.mode})`);
      return backend;
    })().catch((error) => {
      globalForDb.__fsd_backend = undefined;
      throw error;
    });
  }
  return globalForDb.__fsd_backend;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const backend = await getBackend();
  const result = await backend.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Run `fn` inside a transaction with a dedicated client. */
export async function withTransaction<T>(
  fn: (tx: Queryable) => Promise<T>,
): Promise<T> {
  const backend = await getBackend();
  if (backend.mode === "pglite") {
    // PGlite is a single connection; serialise with a simple BEGIN/COMMIT.
    await backend.query("begin");
    try {
      const result = await fn(backend);
      await backend.query("commit");
      return result;
    } catch (error) {
      await backend.query("rollback");
      throw error;
    }
  }

  const pool = globalForDb.__fsd_pg_pool!;
  const client: PoolClient = await pool.connect();
  const tx: Queryable = {
    query: async <R>(text: string, params?: unknown[]) => {
      const result = await client.query(text, params as unknown[] | undefined);
      return { rows: result.rows as R[], rowCount: result.rowCount };
    },
  };
  try {
    await client.query("begin");
    const result = await fn(tx);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export const newToken = () => randomBytes(32).toString("base64url");

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}
