#!/usr/bin/env node
/**
 * Applies every SQL file in supabase/migrations to the database in DATABASE_URL.
 * Safe to re-run: all statements are idempotent ("if not exists").
 *
 *   DATABASE_URL='postgresql://…' npm run db:migrate
 *   DATABASE_URL='postgresql://…' ADMIN_USERNAME=… ADMIN_PASSWORD=… npm run db:setup
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required (Supabase → Settings → Database → Connection string).");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
});

const dir = path.join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir).filter((file) => file.endsWith(".sql")).sort();

for (const file of files) {
  const sql = readFileSync(path.join(dir, file), "utf8");
  process.stdout.write(`→ ${file} … `);
  try {
    await pool.query(sql);
    console.log("done");
  } catch (error) {
    console.log("failed");
    console.error(error instanceof Error ? error.message : error);
    await pool.end();
    process.exit(1);
  }
}

const { rows } = await pool.query(
  "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
);
console.log(`\nReady. ${rows.length} tables in public schema:`);
console.log(rows.map((row) => `  ${row.table_name}`).join("\n"));
await pool.end();
