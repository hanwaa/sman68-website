import { Pool } from "pg";

export type Row = Record<string, unknown>;

const RAW = Symbol("sman68DbRaw");
export type RawFragment = { [RAW]: string };

/**
 * Fragmen SQL mentah untuk klausa dinamis (mis. filter WHERE opsional).
 * HANYA untuk string yang dibangun dari konstanta/pola internal, JANGAN
 * pernah interpolasikan input user langsung; nilai user tetap lewat parameter.
 */
export function raw(text: string): RawFragment {
  return { [RAW]: text };
}

function isRaw(value: unknown): value is RawFragment {
  return typeof value === "object" && value !== null && RAW in value;
}

export type Db = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Row[]>;
  query(text: string, params?: unknown[]): Promise<Row[]>;
  transaction<T>(run: (query: (text: string, params?: unknown[]) => Promise<Row[]>) => Promise<T>): Promise<T>;
};

function createPgDb(url: string): Db {
  const pool = new Pool({
    connectionString: url,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    // Batas eksekusi per statement agar query gantung tidak memegang
    // koneksi pool selamanya (pool hanya 10; 1 admin berat = 6 koneksi).
    statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS ?? 10_000),
  });
  pool.on("error", (error) => {
    console.error("[db] idle client error:", error.message);
  });

  const db = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = "";
    const params: unknown[] = [];
    strings.forEach((chunk, index) => {
      text += chunk;
      if (index < values.length) {
        const value = values[index];
        if (isRaw(value)) {
          text += value[RAW];
        } else {
          params.push(value);
          text += `$${params.length}`;
        }
      }
    });
    const result = await pool.query(text, params);
    return result.rows as Row[];
  }) as Db;

  db.query = async (text: string, params: unknown[] = []) => {
    const result = await pool.query(text, params);
    return result.rows as Row[];
  };
  db.transaction = async <T>(run: (query: (text: string, params?: unknown[]) => Promise<Row[]>) => Promise<T>): Promise<T> => {
    const client = await pool.connect();
    try {
      await client.query("begin");
      const result = await run(async (text: string, params: unknown[] = []) => {
        const res = await client.query(text, params);
        return res.rows as Row[];
      });
      await client.query("commit");
      return result;
    } catch (error) {
      try {
        await client.query("rollback");
      } catch {
        /* abaikan rollback gagal */
      }
      throw error;
    } finally {
      client.release();
    }
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
      "DATABASE_URL belum diisi. Salin .env.example ke .env.local lalu isi connection string PostgreSQL."
    );
  }
  globalForDb.__sman68Db = createPgDb(url);
  return globalForDb.__sman68Db;
}
