import { Pool } from "pg";

let pool: Pool | null = null;

export function getPostgresPool() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_URL.includes("sslmode=require") ||
        process.env.DATABASE_URL.includes("localhost")
          ? undefined
          : { rejectUnauthorized: false }
    });
  }

  return pool;
}
