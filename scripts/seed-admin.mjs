#!/usr/bin/env node
/**
 * Creates (or updates) the single admin account for Yousuf.
 *
 *   ADMIN_USERNAME=samee_mine ADMIN_PASSWORD='…' npm run db:setup
 *
 * The password is hashed with bcrypt (cost 12) and only the hash is stored.
 * Nothing is ever written to the frontend bundle.
 */
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
const connectionString = process.env.DATABASE_URL;

if (!username || !password) {
  console.error(
    "Set ADMIN_USERNAME and ADMIN_PASSWORD (e.g. in .env.local or the shell).",
  );
  process.exit(1);
}
if (password.length < 10) {
  console.error("Refusing a password shorter than 10 characters.");
  process.exit(1);
}
if (!connectionString) {
  console.error("DATABASE_URL is required for this script (hosted Postgres).");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
});

const hash = await bcrypt.hash(password, 12);

const { rows } = await pool.query(
  `insert into admin_users (username, password_hash, display_name)
   values ($1, $2, 'Yousuf')
   on conflict (username) do update
     set password_hash = excluded.password_hash,
         failed_attempts = 0,
         locked_until = null
   returning id, username, updated_at`,
  [username.trim().toLowerCase(), hash],
);

console.log(`Admin account ready: ${rows[0].username} (${rows[0].id})`);
await pool.end();
