import { Pool, type PoolClient, type QueryResultRow } from "pg";

let pool: Pool | null = null;

export type StorageBackend = "postgres" | "json";

/** Production requires DATABASE_URL. Dev may set STORAGE_BACKEND=json explicitly. */
export function getStorageBackend(): StorageBackend {
  if (process.env.DATABASE_URL) return "postgres";
  if (process.env.STORAGE_BACKEND === "json") return "json";
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production. Configure PostgreSQL on Render.");
  }
  throw new Error(
    "No database configured. Set DATABASE_URL (PostgreSQL/Supabase) or STORAGE_BACKEND=json for local JSON dev only.",
  );
}

export function isPostgres(): boolean {
  return getStorageBackend() === "postgres";
}

function sslConfig() {
  if (process.env.PGSSLMODE === "disable") return undefined;
  // Supabase and most managed Postgres require SSL in production
  return { rejectUnauthorized: false };
}

export function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new Pool({
      connectionString: url,
      ssl: sslConfig(),
      max: 10,
    });
  }
  return pool;
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return getPool().query<T>(text, params);
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
