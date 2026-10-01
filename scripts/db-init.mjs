/**
 * Inisialisasi schema PostgreSQL.
 * Jalankan: node --env-file=.env.local scripts/db-init.mjs
 */
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum diisi. Salin .env.example ke .env.local lalu isi kredensial PostgreSQL.");
  process.exit(1);
}

const { Pool } = await import("pg");
const pool = new Pool({ connectionString: url });
const sql = {
  query: async (text, params = []) => (await pool.query(text, params)).rows,
};
console.log("Driver: pg (PostgreSQL)");

const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

const statements = schema
  .split(/;\s*(?:\r?\n|$)/)
  .map((s) =>
    s
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim()
  )
  .filter(Boolean);

console.log(`Menjalankan ${statements.length} statement...`);
for (const statement of statements) {
  await sql.query(statement);
  const label = statement.replace(/\s+/g, " ").slice(0, 70);
  console.log(`  ok  ${label}...`);
}
await pool.end();
console.log("Schema PostgreSQL siap.");
