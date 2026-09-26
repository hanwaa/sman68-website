import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";

export type Row = Record<string, unknown>;

export type Db = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Row[]>;
  query(text: string, params?: unknown[]): Promise<Row[]>;
};

function isNeonUrl(url: string): boolean {
  try {
    return /(^|\.)neon\.tech$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function createNeonDb(url: string): Db {
  const sql = neon(url, { fetchOptions: { cache: "no-store" } });
  const tagged = sql as unknown as (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<Row[]>;
  const neonQuery = (
    sql as unknown as { query: (text: string, params?: unknown[]) => Promise<Row[]> }
  ).query.bind(sql);
  const db = ((strings: TemplateStringsArray, ...values: unknown[]) =>
    tagged(strings, ...values)) as unknown as Db;
  db.query = (text, params = []) => neonQuery(text, params);
  return db;
}

function createPgDb(url: string): Db {
  const pool = new Pool({
    connectionString: url,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  pool.on("error", (error) => {
    console.error("[db] idle client error:", error.message);
  });

  const db = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = "";
    strings.forEach((chunk, index) => {
      text += chunk;
      if (index < values.length) text += `$${index + 1}`;
    });
    const result = await pool.query(text, values);
    return result.rows as Row[];
  }) as Db;

  db.query = async (text: string, params: unknown[] = []) => {
    const result = await pool.query(text, params);
    return result.rows as Row[];
  };
  return db;
}

const globalForDb = globalThis as unknown as { __sman68Db?: Db };

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): Db {
  if (globalForDb.__sman68Db) return globalForDb.__sman68Db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL belum diisi. Salin .env.example ke .env.local lalu isi connection string PostgreSQL (Neon atau server lokal)."
    );
  }
  globalForDb.__sman68Db = isNeonUrl(url) ? createNeonDb(url) : createPgDb(url);
  return globalForDb.__sman68Db;
}
